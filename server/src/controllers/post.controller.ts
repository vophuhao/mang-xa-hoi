import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import FollowModel from "@/models/follow.model";
import LikeModel from "@/models/like.model";
import PostModel from "@/models/post.model";
import UserModel from "@/models/user.model";
import { createPost } from "@/services/post.service";
import { AppError } from "@/utils/AppError";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  createPostSchema,
  getFeedPostsSchema,
  getPostByIdSchema,
  likePostSchema,
} from "@/validators";

// Create a new post
export const createPostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    throw AppError.unauthorized("User not authenticated");
  }

  const validatedData = createPostSchema.parse(req.body);

  // Create post with enhanced features
  const post = await createPost({
    user: userId,
    ...validatedData,
  });

  // Update user's post count
  await UserModel.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

  return ResponseUtil.created(res, post, "Post created successfully");
});

// Get feed posts (following users + suggested)
export const getFeedHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10 } = getFeedPostsSchema.parse(req.query);
  const userId = req.userId;
  const skip = (page - 1) * limit;

  // Get users that current user is following
  const followingUsers = await FollowModel.find({ follower: userId }).distinct("following");

  // Include current user's posts in feed
  const feedUserIds = [...followingUsers, userId];

  // Get posts from followed users + own posts
  const posts = await PostModel.find({
    user: { $in: feedUserIds },
    isHidden: false,
  })
    .populate("user", "username fullName avatarUrl isVerified")
    .populate({
      path: "mentions",
      select: "username fullName",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Add like status for current user
  const postsWithLikes = await Promise.all(
    posts.map(async post => {
      const isLiked = await LikeModel.findOne({
        user: userId,
        post: post._id,
        type: "post",
      });

      return {
        ...post.toObject(),
        isLiked: !!isLiked,
      };
    })
  );

  const total = await PostModel.countDocuments({
    user: { $in: feedUserIds },
    isHidden: false,
  });

  return ResponseUtil.paginated(res, postsWithLikes, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  });
});

// Get single post by ID
export const getPostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = getPostByIdSchema.parse(req.params);

  const post = await PostModel.findById(id)
    .populate("user", "username fullName avatarUrl isVerified")
    .populate({
      path: "mentions",
      select: "username fullName",
    });

  if (!post) {
    throw AppError.notFound("Post not found");
  }

  // Check if current user liked this post
  const isLiked = await LikeModel.findOne({
    user: req.userId,
    post: post._id,
    type: "post",
  });

  const postWithLike = {
    ...post.toObject(),
    isLiked: !!isLiked,
  };

  return ResponseUtil.success(res, postWithLike);
});

// Like/Unlike a post
export const likePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { postId } = likePostSchema.parse(req.body);
  const userId = req.userId;

  const post = await PostModel.findById(postId);
  if (!post) {
    throw AppError.notFound("Post not found");
  }

  // Check if user already liked this post
  const existingLike = await LikeModel.findOne({
    user: userId,
    post: postId,
    type: "post",
  });

  if (existingLike) {
    // Unlike the post
    await LikeModel.deleteOne({ _id: existingLike._id });
    await post.decrementLike();

    return ResponseUtil.success(res, {
      message: "Post unliked successfully",
      isLiked: false,
      likeCount: post.likeCount,
    });
  } else {
    // Like the post
    await LikeModel.create({
      user: userId,
      post: postId,
      type: "post",
    });
    await post.incrementLike();

    return ResponseUtil.success(res, {
      message: "Post liked successfully",
      isLiked: true,
      likeCount: post.likeCount,
    });
  }
});

// Delete a post
export const deletePostHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = getPostByIdSchema.parse(req.params);
  const userId = req.userId;

  const post = await PostModel.findById(id);
  if (!post) {
    throw AppError.notFound("Post not found");
  }

  // Check if user owns this post
  if (post.user.toString() !== userId.toString()) {
    throw AppError.forbidden("You can only delete your own posts");
  }

  // Delete associated likes
  await LikeModel.deleteMany({ post: id });

  // Delete the post
  await PostModel.findByIdAndDelete(id);

  // Update user's post count
  await UserModel.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

  return ResponseUtil.success(res, { message: "Post deleted successfully" });
});

// Get explore posts (trending/popular posts)
export const getExplorePostsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 21 } = req.query as any; // Instagram shows 21 posts in explore grid
    const skip = (page - 1) * limit;

    // Get popular posts based on likes and recent activity
    const posts = await PostModel.find({ isHidden: false })
      .populate("user", "username fullName avatarUrl isVerified")
      .sort({
        likeCount: -1,
        viewCount: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    const total = await PostModel.countDocuments({ isHidden: false });

    return ResponseUtil.paginated(res, posts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });
  }
);
