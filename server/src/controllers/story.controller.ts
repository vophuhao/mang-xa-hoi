import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import mongoose from "mongoose";

import FollowModel from "@/models/follow.model";
import LikeModel from "@/models/like.model";
import StoryModel from "@/models/story.model";
import UserModel from "@/models/user.model";
import { AppError } from "@/utils/AppError";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import { validateCreateStory } from "@/validators/story.validator";

// Create a new story
export const createStoryHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  // Validate request data
  const validationErrors = validateCreateStory(req.body);
  if (validationErrors.length > 0) {
    throw AppError.badRequest(`Validation failed: ${validationErrors.join(", ")}`);
  }

  const {
    mediaUrl,
    mediaType = "image",
    duration = 24,
    caption,
    backgroundColor,
    location,
    mentions,
    tags,
  } = req.body;

  // Calculate expiry time (default 24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + duration);

  // Prepare story data
  const storyData: any = {
    user: userId,
    mediaUrl,
    mediaType,
    expiresAt,
    viewCount: 0,
    viewers: [],
  };

  // Add optional fields only if they have valid values
  if (caption && caption.trim()) {
    storyData.caption = caption.trim();
  }

  if (backgroundColor) {
    storyData.backgroundColor = backgroundColor;
  }

  if (location) {
    const locationData: any = {};

    if (location.name && location.name.trim()) {
      locationData.name = location.name.trim();
    }

    if (
      location.coordinates &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      locationData.coordinates = location.coordinates;
    }

    // Only add location if it has valid data
    if (Object.keys(locationData).length > 0) {
      storyData.location = locationData;
    }
  }

  if (mentions && Array.isArray(mentions) && mentions.length > 0) {
    storyData.mentions = mentions;
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    storyData.tags = tags;
  }

  const story = await StoryModel.create(storyData);

  // Populate user details
  await story.populate("user", "username fullName avatarUrl isVerified");

  return ResponseUtil.created(res, story, "Story created successfully");
});

// Get stories from followed users
export const getStoriesHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  // Get users that current user is following + current user
  const followingUsers = await FollowModel.find({ follower: userId }).distinct("following");
  const userIds = [...followingUsers, userId];

  // Get active stories from these users
  const stories = await StoryModel.find({
    user: { $in: userIds },
    expiresAt: { $gt: new Date() },
  })
    .populate("user", "username fullName avatarUrl isVerified")
    .sort({ createdAt: -1 });

  // Get user's likes for these stories
  const storyIds = stories.map(story => story._id);
  const userLikes = await LikeModel.find({
    user: userId,
    story: { $in: storyIds },
  }).select("story");

  const likedStoryIds = new Set(userLikes.map(like => like.story.toString()));

  // Group stories by user and add like info
  const storiesByUser = stories.reduce((acc: any, story) => {
    const storyUserId = story.user._id.toString();
    if (!acc[storyUserId]) {
      acc[storyUserId] = {
        user: story.user,
        stories: [],
        hasUnviewed: false,
      };
    }

    // Add like status to story
    const storyWithLikeInfo = {
      ...story.toObject(),
      isLiked: likedStoryIds.has(story._id.toString()),
    };

    acc[storyUserId].stories.push(storyWithLikeInfo);

    // Check if any story hasn't been viewed by current user (convert to string for proper comparison)
    const hasViewed = story.viewers.some(viewerId => viewerId.toString() === userId.toString());
    if (!hasViewed) {
      acc[storyUserId].hasUnviewed = true;
    }

    return acc;
  }, {});

  const groupedStories = Object.values(storiesByUser);

  // Sort to put current user's stories first, then by creation time
  groupedStories.sort((a: any, b: any) => {
    const aIsCurrentUser = a.user._id.toString() === userId.toString();
    const bIsCurrentUser = b.user._id.toString() === userId.toString();

    if (aIsCurrentUser && !bIsCurrentUser) return -1;
    if (!aIsCurrentUser && bIsCurrentUser) return 1;

    // If both or neither are current user, sort by latest story creation time
    const aLatestTime = Math.max(...a.stories.map((s: any) => new Date(s.createdAt).getTime()));
    const bLatestTime = Math.max(...b.stories.map((s: any) => new Date(s.createdAt).getTime()));
    return bLatestTime - aLatestTime;
  });

  return ResponseUtil.success(res, groupedStories);
});

// Get user's own stories
export const getUserStoriesHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const stories = await StoryModel.find({
      user: userId,
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({ createdAt: -1 });

    // Add like info for own stories (always false since users can't like their own stories)
    const storiesWithLikeInfo = stories.map(story => ({
      ...story.toObject(),
      isLiked: false,
    }));

    return ResponseUtil.success(res, storiesWithLikeInfo);
  }
);

// Get all user's stories (including expired) for highlights
export const getAllUserStoriesHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const stories = await StoryModel.find({
      user: userId,
    })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 stories to avoid performance issues

    return ResponseUtil.success(res, stories);
  }
);

// Get stories by username
export const getStoriesByUsernameHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username } = req.params;
    const currentUserId = req.userId;

    // Find user by username
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Check if current user can view stories (following or public profile)
    const isFollowing = await FollowModel.findOne({
      follower: currentUserId,
      following: user._id,
    });

    const isOwnProfile = (user._id as any).toString() === currentUserId.toString();

    if (!isOwnProfile && !isFollowing && user.isPrivate) {
      throw AppError.forbidden("Cannot view stories from private account you don't follow");
    }

    const stories = await StoryModel.find({
      user: user._id,
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({ createdAt: -1 });

    return ResponseUtil.success(res, stories);
  }
);

// View a story (mark as viewed)
export const viewStoryHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { storyId } = req.params;
  const userId = req.userId;

  const story = await StoryModel.findById(storyId);
  if (!story) {
    throw AppError.notFound("Story not found");
  }

  // Check if story has expired
  if (story.expiresAt < new Date()) {
    throw AppError.badRequest("Story has expired");
  }

  // Add viewer if not already viewed (convert to string for proper comparison)
  const viewerExists = story.viewers.some(viewerId => viewerId.toString() === userId.toString());
  if (!viewerExists) {
    // Clean duplicates before adding (in case DB has existing duplicates)
    const uniqueViewers = story.viewers.filter(
      (viewerId, index, array) =>
        array.findIndex(v => v.toString() === viewerId.toString()) === index
    );

    uniqueViewers.push(userId as any);
    story.viewers = uniqueViewers;
    story.viewCount = uniqueViewers.length;
    await story.save();
  }

  return ResponseUtil.success(res, {
    message: "Story viewed",
    viewCount: story.viewCount,
  });
});

// Get story viewers (only for story owner)
export const getStoryViewersHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await StoryModel.findById(storyId)
      .populate("viewers", "username fullName avatarUrl isVerified")
      .populate("user", "username fullName avatarUrl isVerified");

    if (!story) {
      throw AppError.notFound("Story not found");
    }

    // Check if user owns this story
    if (story.user._id.toString() !== userId.toString()) {
      throw AppError.forbidden("You can only view viewers of your own stories");
    }

    // Deduplicate viewers first (in case there are duplicates in DB)
    const uniqueViewers = story.viewers.filter(
      (viewer: any, index: number, array: any[]) =>
        array.findIndex((v: any) => v._id.toString() === viewer._id.toString()) === index
    );

    // Format viewers with mock viewedAt since we only store user IDs currently
    const formattedViewers = uniqueViewers.map((viewer: any) => ({
      _id: viewer._id,
      user: viewer,
      viewedAt: story.createdAt, // Use story creation time as fallback
    }));

    return ResponseUtil.success(res, {
      story: {
        _id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
        viewCount: story.viewCount,
      },
      viewers: formattedViewers,
    });
  }
);

// Delete a story
export const deleteStoryHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { storyId } = req.params;
  const userId = req.userId;

  const story = await StoryModel.findById(storyId);
  if (!story) {
    throw AppError.notFound("Story not found");
  }

  // Check if user owns this story
  if (story.user.toString() !== userId.toString()) {
    throw AppError.forbidden("You can only delete your own stories");
  }

  await StoryModel.findByIdAndDelete(storyId);

  return ResponseUtil.success(res, { message: "Story deleted successfully" });
});

// Like/Unlike a story
export const likeStoryHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { storyId } = req.params;
  const userId = req.userId;

  const story = await StoryModel.findById(storyId);
  if (!story) {
    throw AppError.notFound("Story not found");
  }

  // Check if story has expired
  if (new Date(story.expiresAt) < new Date()) {
    throw AppError.badRequest("Cannot like expired story");
  }

  // Check if user already liked this story
  const existingLike = await LikeModel.findOne({
    user: userId,
    story: storyId,
  });

  if (existingLike) {
    // Unlike
    await LikeModel.deleteOne({ _id: existingLike._id });
    await StoryModel.findByIdAndUpdate(storyId, { $inc: { likeCount: -1 } });

    return ResponseUtil.success(res, { liked: false, message: "Story unliked" });
  } else {
    // Like
    await LikeModel.create({
      user: userId,
      story: storyId,
      type: "story",
    });
    await StoryModel.findByIdAndUpdate(storyId, { $inc: { likeCount: 1 } });

    return ResponseUtil.success(res, { liked: true, message: "Story liked" });
  }
});

// Get story likes
export const getStoryLikesHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw AppError.notFound("Story not found");
    }

    const likes = await LikeModel.find({ story: storyId })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await LikeModel.countDocuments({ story: storyId });

    return ResponseUtil.success(res, {
      likes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  }
);

// Cleanup duplicate viewers (temporary endpoint for fixing existing data)
export const cleanupDuplicateViewersHandler = catchErrors(
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("🧹 Starting cleanup of duplicate viewers...");

      // Get all stories
      const stories = await StoryModel.find({});
      let fixedCount = 0;

      for (const story of stories) {
        const originalViewersCount = story.viewers.length;

        // Remove duplicates by converting to string, using Set, then back to ObjectId
        const uniqueViewerIds = [...new Set(story.viewers.map((v: any) => v.toString()))];
        const uniqueViewers = uniqueViewerIds.map((id: string) => new mongoose.Types.ObjectId(id));

        if (uniqueViewers.length !== originalViewersCount) {
          // Update story with unique viewers
          story.viewers = uniqueViewers as any[];
          story.viewCount = uniqueViewers.length;
          await story.save();

          fixedCount++;
          console.log(
            `📍 Fixed story ${story._id}: ${originalViewersCount} → ${uniqueViewers.length} viewers`
          );
        }
      }

      return ResponseUtil.success(res, {
        message: `Cleanup completed! Fixed ${fixedCount} stories with duplicate viewers.`,
        fixedCount,
        totalStories: stories.length,
      });
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      throw AppError.badRequest("Cleanup failed");
    }
  }
);

// Get story analytics (for story owner)
export const getStoryAnalyticsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw AppError.notFound("Story not found");
    }

    // Check if user owns this story
    if (story.user.toString() !== userId.toString()) {
      throw AppError.forbidden("You can only view analytics of your own stories");
    }

    const analytics = {
      views: story.viewCount,
      reach: story.viewers.length, // Unique viewers
      impressions: story.viewCount, // Total views (could be more than unique if users view multiple times)
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      mediaType: story.mediaType,
    };

    return ResponseUtil.success(res, analytics);
  }
);

// Create highlight from expired stories
export const createHighlightHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { title, storyIds } = req.body;

    if (!title || !Array.isArray(storyIds) || storyIds.length === 0) {
      throw AppError.badRequest("Title and story IDs are required");
    }

    // Find the stories and verify they belong to the user and are expired
    const stories = await StoryModel.find({
      _id: { $in: storyIds },
      user: userId,
      expiresAt: { $lt: new Date() }, // Only expired stories can be highlighted
    });

    if (stories.length !== storyIds.length) {
      throw AppError.badRequest("Some stories were not found or are not expired yet");
    }

    // Mark stories as highlights
    await StoryModel.updateMany(
      { _id: { $in: storyIds } },
      {
        isHighlight: true,
        highlightTitle: title,
      }
    );

    // Get updated stories
    const highlightedStories = await StoryModel.find({
      _id: { $in: storyIds },
    }).populate("user", "username fullName avatarUrl isVerified");

    return ResponseUtil.success(res, {
      title,
      stories: highlightedStories,
      thumbnail: highlightedStories[0]?.mediaUrl, // Use first story as thumbnail
    });
  }
);

// Get user's highlights
export const getHighlightsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { username } = req.params;
    const currentUserId = req.userId;

    // Find user by username
    const user = await UserModel.findOne({ username });
    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Check if current user can view highlights (following or public profile)
    const isFollowing = await FollowModel.findOne({
      follower: currentUserId,
      following: user._id,
    });

    const isOwnProfile = (user._id as any).toString() === currentUserId.toString();

    if (!isOwnProfile && !isFollowing && user.isPrivate) {
      throw AppError.forbidden("Cannot view highlights from private account you don't follow");
    }

    // Get highlights grouped by title
    const highlightStories = await StoryModel.find({
      user: user._id,
      isHighlight: true,
    })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({ createdAt: -1 });

    // Group by highlight title
    const highlights = highlightStories.reduce((acc: any, story) => {
      const title = story.highlightTitle || "Untitled";
      if (!acc[title]) {
        acc[title] = {
          id: title,
          title,
          thumbnail: story.mediaUrl,
          stories: [],
        };
      }
      acc[title].stories.push(story);
      return acc;
    }, {});

    return ResponseUtil.success(res, Object.values(highlights));
  }
);

// Remove story from highlight
export const removeFromHighlightHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await StoryModel.findById(storyId);
    if (!story) {
      throw AppError.notFound("Story not found");
    }

    // Check if user owns this story
    if (story.user.toString() !== userId.toString()) {
      throw AppError.forbidden("You can only manage your own story highlights");
    }

    // Remove from highlight
    story.isHighlight = false;
    delete (story as any).highlightTitle;
    await story.save();

    return ResponseUtil.success(res, { message: "Story removed from highlight" });
  }
);

// Delete entire highlight
export const deleteHighlightHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { highlightTitle } = req.params;
    const userId = req.userId;

    // Remove all stories from this highlight
    const result = await StoryModel.updateMany(
      {
        user: userId,
        highlightTitle,
        isHighlight: true,
      },
      {
        isHighlight: false,
        $unset: { highlightTitle: "" },
      }
    );

    if (result.modifiedCount === 0) {
      throw AppError.notFound("Highlight not found");
    }

    return ResponseUtil.success(res, {
      message: "Highlight deleted successfully",
      removedCount: result.modifiedCount,
    });
  }
);
