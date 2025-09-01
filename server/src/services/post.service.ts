import FollowModel from "@/models/follow.model";
import HashtagModel from "@/models/hashtag.model";
import LikeModel from "@/models/like.model";
import NotificationModel from "@/models/notification.model";
import PostModel from "@/models/post.model";
import SavedPostModel from "@/models/savedPost.model";
import ErrorFactory from "@/utils/ErrorFactory";
import mongoose from "mongoose";

export type CreateNewPost = {
  user: mongoose.Types.ObjectId;
  caption?: string;
  mediaUrls: string[];
  tags?: string[];
  location?: string;
  mentions?: mongoose.Types.ObjectId[];
};

export interface GetFeedParams {
  userId: string;
  page: number;
  limit: number;
}

export interface GetPostParams {
  postId: string;
  userId?: string;
}

/**
 * Post service containing all post-related business logic
 */
export class PostService {
  /**
   * Create a new post
   */
  static async createPost(data: CreateNewPost) {
    // Validate that we have media
    if (!data.mediaUrls || data.mediaUrls.length === 0) {
      throw ErrorFactory.validationFailed("Post must have at least one media item");
    }

    // Determine media type
    let mediaType: "image" | "video" | "carousel" = "image";
    if (data.mediaUrls.length > 1) {
      mediaType = "carousel";
    }
    // You can add logic here to detect video based on file extension or metadata

    // Extract hashtags from caption if not provided in tags
    let hashtags = data.tags || [];
    if (data.caption) {
      const hashtagMatches = data.caption.match(/#\w+/g);
      if (hashtagMatches) {
        const captionHashtags = hashtagMatches.map(tag => tag.slice(1)); // Remove #
        hashtags = [...new Set([...hashtags, ...captionHashtags])];
      }
    }

    // Create location object if provided
    const location = data.location ? { name: data.location } : undefined;

    const post = await PostModel.create({
      user: data.user,
      caption: data.caption,
      mediaUrls: data.mediaUrls,
      mediaType,
      location,
      tags: hashtags,
      mentions: data.mentions || [],
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isHidden: false,
      commentsDisabled: false,
      likesHidden: false,
    });

    // Update hashtag counts
    if (hashtags.length > 0) {
      await Promise.all(hashtags.map(tag => HashtagModel.incrementPostCount(tag)));
    }

    // Create notifications for mentioned users
    if (data.mentions && data.mentions.length > 0) {
      const mentionNotifications = data.mentions.map(mentionedUserId =>
        NotificationModel.create({
          recipient: mentionedUserId,
          sender: data.user,
          type: "mention",
          post: post._id,
          message: "mentioned you in a post",
        })
      );
      await Promise.all(mentionNotifications);
    }

    return post.populate("user", "username fullName avatarUrl isVerified");
  }

  /**
   * Get post by ID with user context
   */
  static async getPostById({ postId, userId }: GetPostParams) {
    const post = await PostModel.findById(postId)
      .populate("user", "username fullName avatarUrl isVerified")
      .populate("comments");

    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    // If user is provided, check if they liked/saved the post
    let isLiked = false;
    let isSaved = false;

    if (userId) {
      [isLiked, isSaved] = await Promise.all([
        LikeModel.exists({ user: userId, post: postId }).then(Boolean),
        SavedPostModel.exists({ user: userId, post: postId }).then(Boolean),
      ]);
    }

    return {
      ...post.toJSON(),
      isLiked,
      isSaved,
    };
  }

  /**
   * Get user's feed posts
   */
  static async getFeed({ userId, page = 1, limit = 10 }: GetFeedParams) {
    const skip = (page - 1) * limit;

    // Get users that current user follows
    const following = await FollowModel.find({ follower: userId }).select("following");
    const followingIds = following.map(f => f.following);

    // Include user's own posts
    const userIds = [userId, ...followingIds];

    const [posts, total] = await Promise.all([
      PostModel.find({
        user: { $in: userIds },
        isHidden: false,
      })
        .populate("user", "username fullName avatarUrl isVerified")
        .populate("comments")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PostModel.countDocuments({
        user: { $in: userIds },
        isHidden: false,
      }),
    ]);

    // Check which posts user has liked/saved
    const postIds = posts.map(post => post._id);
    const [userLikes, userSaves] = await Promise.all([
      LikeModel.find({ user: userId, post: { $in: postIds } }).select("post"),
      SavedPostModel.find({ user: userId, post: { $in: postIds } }).select("post"),
    ]);

    const likedPostIds = new Set(userLikes.map(like => like.post?.toString()).filter(Boolean));
    const savedPostIds = new Set(userSaves.map(save => save.post?.toString()).filter(Boolean));

    const postsWithUserContext = posts.map(post => ({
      ...post.toJSON(),
      isLiked: likedPostIds.has((post._id as any).toString()),
      isSaved: savedPostIds.has((post._id as any).toString()),
    }));

    return {
      data: postsWithUserContext,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Like/unlike a post
   */
  static async togglePostLike(postId: string, userId: string) {
    const post = await PostModel.findById(postId);

    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    const existingLike = await LikeModel.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Unlike
      await LikeModel.findByIdAndDelete(existingLike._id);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await post.save();

      return {
        isLiked: false,
        likeCount: post.likeCount,
        message: "Post unliked",
      };
    } else {
      // Like
      await LikeModel.create({ user: userId, post: postId, type: "post" });
      post.likeCount += 1;
      await post.save();

      // Create notification for post owner (if not self-liking)
      if (post.user.toString() !== userId) {
        await NotificationModel.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: postId,
          message: "liked your post",
        });
      }

      return {
        isLiked: true,
        likeCount: post.likeCount,
        message: "Post liked",
      };
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string, userId: string) {
    const post = await PostModel.findById(postId);

    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    // Check if user owns the post
    if (post.user.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only delete your own posts");
    }

    // Delete associated data
    await Promise.all([
      // Delete likes
      LikeModel.deleteMany({ post: postId }),
      // Delete saved posts
      SavedPostModel.deleteMany({ post: postId }),
      // Delete notifications
      NotificationModel.deleteMany({ post: postId }),
      // Delete comments handled by cascade delete if configured
    ]);

    // Decrement hashtag counts
    if (post.tags && post.tags.length > 0) {
      await Promise.all(post.tags.map(tag => HashtagModel.decrementPostCount(tag)));
    }

    // Delete the post
    await PostModel.findByIdAndDelete(postId);

    return { message: "Post deleted successfully" };
  }

  /**
   * Update post
   */
  static async updatePost(
    postId: string,
    userId: string,
    updateData: { caption?: string; commentsDisabled?: boolean }
  ) {
    const post = await PostModel.findById(postId);

    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    // Check if user owns the post
    if (post.user.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only edit your own posts");
    }

    // Update allowed fields
    if (updateData.caption !== undefined) {
      post.caption = updateData.caption;

      // Re-extract hashtags from new caption
      const hashtagMatches = updateData.caption.match(/#\w+/g);
      if (hashtagMatches) {
        const newHashtags = hashtagMatches.map(tag => tag.slice(1));
        post.tags = [...new Set(newHashtags)];
      }
    }

    if (updateData.commentsDisabled !== undefined) {
      post.commentsDisabled = updateData.commentsDisabled;
    }

    await post.save();
    await post.populate("user", "username fullName avatarUrl isVerified");

    return post;
  }

  /**
   * Get trending posts
   */
  static async getTrendingPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get posts from last 7 days with high engagement
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await PostModel.find({
      createdAt: { $gte: weekAgo },
      isHidden: false,
    })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({
        likeCount: -1,
        commentCount: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    return posts;
  }
}

// Legacy function for backward compatibility
export async function createPost(data: CreateNewPost) {
  return PostService.createPost(data);
}

export default PostService;
