import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import FollowModel from "@/models/follow.model";
import StoryModel from "@/models/story.model";
import UserModel from "@/models/user.model";
import { AppError } from "@/utils/AppError";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";

// Create a new story
export const createStoryHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { mediaUrl, mediaType = "image", duration = 24 } = req.body;

  if (!mediaUrl) {
    throw AppError.badRequest("Media URL is required for stories");
  }

  // Delete any existing active story from this user (Instagram allows only one active story per user)
  await StoryModel.deleteMany({
    user: userId,
    expiresAt: { $gt: new Date() },
  });

  // Calculate expiry time (default 24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + duration);

  const story = await StoryModel.create({
    user: userId,
    mediaUrl,
    mediaType,
    expiresAt,
    viewCount: 0,
    viewers: [],
  });

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

  // Group stories by user
  const storiesByUser = stories.reduce((acc: any, story) => {
    const userId = story.user._id.toString();
    if (!acc[userId]) {
      acc[userId] = {
        user: story.user,
        stories: [],
        hasUnviewed: false,
      };
    }
    acc[userId].stories.push(story);

    // Check if any story hasn't been viewed by current user
    if (!story.viewers.includes(userId as any)) {
      acc[userId].hasUnviewed = true;
    }

    return acc;
  }, {});

  const groupedStories = Object.values(storiesByUser);

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

  // Add viewer if not already viewed
  if (!story.viewers.includes(userId as any)) {
    story.viewers.push(userId as any);
    story.viewCount += 1;
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

    return ResponseUtil.success(res, {
      story: {
        _id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        createdAt: story.createdAt,
        viewCount: story.viewCount,
      },
      viewers: story.viewers,
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
