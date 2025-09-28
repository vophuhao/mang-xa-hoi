import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import CommentModel from "@/models/comment.model";
import FollowModel from "@/models/follow.model";
import LikeModel from "@/models/like.model";
import NotificationModel from "@/models/notification.model";
import PostModel from "@/models/post.model";
import SavedPostModel from "@/models/savedPost.model";
import StoryModel from "@/models/story.model";
import UserModel from "@/models/user.model";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";

// Get user's profile statistics
export const getUserStatsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  const user = await UserModel.findById(userId).select("followersCount followingCount postsCount");
  if (!user) {
    throw new Error("User not found");
  }

  // Get additional stats
  const [totalLikes, totalComments, savedPostsCount, unreadNotifications, activeStoriesCount] =
    await Promise.all([
      LikeModel.countDocuments({
        post: { $in: await PostModel.find({ user: userId }).distinct("_id") },
        type: "post",
      }),
      CommentModel.countDocuments({
        post: { $in: await PostModel.find({ user: userId }).distinct("_id") },
      }),
      SavedPostModel.countDocuments({ user: userId }),
      NotificationModel.countDocuments({ recipient: userId, isRead: false }),
      StoryModel.countDocuments({
        user: userId,
        expiresAt: { $gt: new Date() },
      }),
    ]);

  const stats = {
    followers: user.followersCount,
    following: user.followingCount,
    posts: user.postsCount,
    totalLikes,
    totalComments,
    savedPosts: savedPostsCount,
    unreadNotifications,
    activeStories: activeStoriesCount,
  };

  return ResponseUtil.success(res, stats);
});

// Get user's activity stats (posts, likes, comments over time)
export const getUserActivityHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { days = 30 } = req.query as any;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [posts, likes, comments] = await Promise.all([
      PostModel.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      LikeModel.aggregate([
        {
          $match: {
            user: userId,
            type: "post",
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      CommentModel.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const activity = {
      period: `${days} days`,
      posts,
      likes,
      comments,
    };

    return ResponseUtil.success(res, activity);
  }
);

// Get engagement stats for user's posts
export const getEngagementStatsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const userPosts = await PostModel.find({ user: userId }).select(
      "_id likeCount commentCount shareCount viewCount createdAt"
    );

    if (userPosts.length === 0) {
      return ResponseUtil.success(res, {
        totalPosts: 0,
        averageLikes: 0,
        averageComments: 0,
        averageShares: 0,
        averageViews: 0,
        engagementRate: 0,
        topPost: null,
      });
    }

    const totalLikes = userPosts.reduce((sum, post) => sum + post.likeCount, 0);
    const totalComments = userPosts.reduce((sum, post) => sum + post.commentCount, 0);
    const totalShares = userPosts.reduce((sum, post) => sum + post.shareCount, 0);
    const totalViews = userPosts.reduce((sum, post) => sum + post.viewCount, 0);

    const averageLikes = Math.round(totalLikes / userPosts.length);
    const averageComments = Math.round(totalComments / userPosts.length);
    const averageShares = Math.round(totalShares / userPosts.length);
    const averageViews = Math.round(totalViews / userPosts.length);

    // Simple engagement rate calculation
    const totalEngagements = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;

    // Find top performing post
    const topPost = userPosts.reduce((max, post) => {
      const postEngagement = post.likeCount + post.commentCount + post.shareCount;
      const maxEngagement = max.likeCount + max.commentCount + max.shareCount;
      return postEngagement > maxEngagement ? post : max;
    });

    const stats = {
      totalPosts: userPosts.length,
      averageLikes,
      averageComments,
      averageShares,
      averageViews,
      engagementRate: parseFloat(engagementRate.toString()),
      topPost: {
        id: topPost._id,
        likes: topPost.likeCount,
        comments: topPost.commentCount,
        shares: topPost.shareCount,
        createdAt: topPost.createdAt,
      },
    };

    return ResponseUtil.success(res, stats);
  }
);

// Get follower growth over time
export const getFollowerGrowthHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { days = 30 } = req.query as any;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const followerGrowth = await FollowModel.aggregate([
      {
        $match: {
          following: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          newFollowers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate cumulative growth
    let cumulative = 0;
    const cumulativeGrowth = followerGrowth.map(day => {
      cumulative += day.newFollowers;
      return {
        date: day._id,
        newFollowers: day.newFollowers,
        totalGrowth: cumulative,
      };
    });

    return ResponseUtil.success(res, {
      period: `${days} days`,
      growth: cumulativeGrowth,
      totalNewFollowers: cumulative,
    });
  }
);

// Get popular hashtags used by user
export const getUserHashtagsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const userPosts = await PostModel.find({ user: userId }).select("tags");

    // Count hashtag usage
    const hashtagCounts = userPosts
      .flatMap(post => post.tags || [])
      .reduce(
        (acc, tag) => {
          acc[String(tag)] = (acc[String(tag)] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    // Sort by usage count
    const popularHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ name: tag, usageCount: count }));

    return ResponseUtil.success(res, popularHashtags);
  }
);
