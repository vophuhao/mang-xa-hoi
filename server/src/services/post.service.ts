import { increaseAudioUsedCount } from "@/controllers/audio.controller";
import FollowModel from "@/models/follow.model";
import HashtagModel from "@/models/hashtag.model";
import LikeModel from "@/models/like.model";
import NotificationModel from "@/models/notification.model";
import PostModel from "@/models/post.model";
import SavedPostModel from "@/models/savedPost.model";
import UserModel from "@/models/user.model";
import ErrorFactory from "@/utils/ErrorFactory";
import { getAudioByIdSchema } from "@/validators/audio.validator";
import mongoose from "mongoose";
import { UserBlockService } from "./userBlock.service";
import { disable } from "colors";
export type CreateNewPost = {
  user: mongoose.Types.ObjectId;
  caption?: string;
  mediaUrls: string[];
  tags?: string[];
  location?: string;
  audioId?: mongoose.Types.ObjectId;
  hideLikes: boolean;
  disableComments: boolean;
  mentions?: string[];
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

    // You can add logic here to detect video based on file extension or metadata

    // Determine post type (post | reel)
    let type: "post" | "reel" = "post";
    if (data.mediaUrls.length === 1) {
      const url = data.mediaUrls[0]!;
      if (url.match(/\.(mp4|mov|webm|avi)$/i)) {
        type = "reel";
      }
    }

    // Extract hashtags from caption if not provided in tags
    let hashtagNames = data.tags || [];
    if (data.caption) {
      const matches = data.caption.match(/#\w+/g);
      if (matches) {
        const captionHashtags = matches.map(t => t.slice(1).toLowerCase());
        hashtagNames = [...new Set([...hashtagNames, ...captionHashtags])];
      }
    }

    const hashtagIds = await Promise.all(
      hashtagNames.map(async name => {
        const hashtag = await HashtagModel.incrementPostCount(name);
        if (!hashtag) throw new Error(`Failed to create or find hashtag: ${name}`);
        return hashtag._id;
      })
    );

    const userDocs = await UserModel.find({
      userId: { $in: data.mentions || [] },
    }).select("_id");

    // Lấy mảng ObjectId
    const mentionIds = userDocs.map(u => u._id);

    // Create location object if provided
    const location = data.location ? { name: data.location } : undefined;

    let audioObjectId: mongoose.Types.ObjectId | undefined = undefined;
    if (data.audioId) {
      // Chỉ validate nếu có audioId
      const { id } = getAudioByIdSchema.parse({ id: data.audioId });
      increaseAudioUsedCount(id);
      audioObjectId = new mongoose.Types.ObjectId(id);
    }

    const post = await PostModel.create({
      user: data.user,
      caption: data.caption,
      mediaUrls: data.mediaUrls,
      type,
      location,
      tags: hashtagIds,
      mentions: mentionIds,
      likeCount: 0,
      audioId: audioObjectId,
      commentCount: 0,
      shareCount: 0,
      viewCount: 0,
      isHidden: false,
      commentsDisabled: data.disableComments,
      likesHidden: data.hideLikes,
    });

    // Update hashtag counts

    // Create notifications for mentioned users
    if (data.mentions && data.mentions.length > 0) {
      const mentionNotifications = mentionIds.map(mentionedUserId =>
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

    return post.populate("user", "username userId avatarUrl isVerified");
  }

  /**
   * Get post by ID with user context
   */
  static async getPostById({ postId, userId }: GetPostParams) {
    const post = await PostModel.findById(postId)
      .populate("user", "username userId avatarUrl isVerified")
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

    const excludedUserIds = await UserBlockService.getExcludedUserIds((userId as any).toString());
    // Get users that current user follows
    const following = await FollowModel.find({ follower: userId }).select("following");
    const followingIds = following.map(f => f.following);

    // Include user's own posts
    const userIds = [userId, ...followingIds];

    const [posts, total] = await Promise.all([
      PostModel.find({
        isHidden: false,
        user: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
      })
        .populate("user", "username userId avatarUrl isVerified userId")
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
    if (!post) throw ErrorFactory.resourceNotFound("Post");

    const existingLike = await LikeModel.findOne({ user: userId, post: postId });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      await LikeModel.findByIdAndDelete(existingLike._id);
      // atomic update
      const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      likeCount = updatedPost!.likeCount;
      isLiked = false;
    } else {
      await LikeModel.create({ user: userId, post: postId, type: "post" });
      const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
      likeCount = updatedPost!.likeCount;
      isLiked = true;

      if (post.user && post.user.toString() !== userId) {
        await NotificationModel.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: postId,
          message: "liked your post",
        });
      }
    }

    return { isLiked, likeCount };
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
      await Promise.all(post.tags.map(tag => HashtagModel.decrementPostCount(tag.toString())));
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
  updateData: {
    caption?: string;
    likesHidden?: boolean;
    commentsDisabled?: boolean;
  }
) {
  const post = await PostModel.findById(postId);
  if (!post) {
    throw ErrorFactory.resourceNotFound("Post");
  }

  // ✅ Kiểm tra quyền sở hữu bài viết
  if (post.user.toString() !== userId) {
    throw ErrorFactory.insufficientPermissions("You can only edit your own posts");
  }

  // ✅ Cập nhật caption + xử lý hashtag
  if (updateData.caption !== undefined) {
    post.caption = updateData.caption;

    // Tìm các hashtag trong caption (vd: #travel #food)
    const hashtagMatches = updateData.caption.match(/#\w+/g);

    if (hashtagMatches && hashtagMatches.length > 0) {
      // Lấy danh sách tên hashtag, loại bỏ trùng lặp
      const hashtagNames = [...new Set(hashtagMatches.map(tag => tag.slice(1).toLowerCase()))];

      // Tìm hoặc tạo mới hashtag trong DB
      const hashtagIds: mongoose.Types.ObjectId[] = await Promise.all(
        hashtagNames.map(async (name) => {
          let hashtag = await HashtagModel.findOne({ name });

          if (!hashtag) {
            // Nếu chưa có hashtag → tạo mới với postCount = 1
            hashtag = await HashtagModel.create({ name, postCount: 1 });
          } else {
            // Nếu có rồi → tăng postCount
            hashtag.postCount += 1;
            await hashtag.save();
          }

          return hashtag._id as mongoose.Types.ObjectId;
        })
      );

      post.tags = hashtagIds;
    } else {
      // Nếu caption không có hashtag thì xóa tags
      post.tags = [];
    }
  }

  // ✅ Cập nhật trạng thái ẩn/hiện like
  if (updateData.likesHidden !== undefined) {
    post.likesHidden = updateData.likesHidden;
  }

  // ✅ Cập nhật trạng thái bật/tắt comment
  if (updateData.commentsDisabled !== undefined) {
    post.commentsDisabled = updateData.commentsDisabled;
  }
  // Lưu thay đổi
  await post.save();

  await post.populate("user", "username userId avatarUrl isVerified");

  return post;
}


  /**
   * Get trending posts
   */
  static async getTrendingPosts(page: number = 1, limit: number = 10, userId?: string) {
    const skip = (page - 1) * limit;

    const excludedUserIds = await UserBlockService.getExcludedUserIds((userId as any).toString());
    // First try to get posts from last 7 days with high engagement
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let posts = await PostModel.find({
      createdAt: { $gte: weekAgo },
      isHidden: false,
      user: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
    })
      .populate("user", "username userId avatarUrl isVerified")
      .sort({
        likeCount: -1,
        commentCount: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // If no trending posts found, fall back to all posts sorted by engagement
    if (posts.length === 0 && skip === 0) {
      posts = await PostModel.find({
        isHidden: false,
      })
        .populate("user", "username userId avatarUrl isVerified")
        .sort({
          likeCount: -1,
          commentCount: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // If user is provided, check like/save status
    if (userId && posts.length > 0) {
      const postIds = posts.map(post => post._id);
      const [userLikes, userSaves] = await Promise.all([
        LikeModel.find({ user: userId, post: { $in: postIds } }).select("post"),
        SavedPostModel.find({ user: userId, post: { $in: postIds } }).select("post"),
      ]);

      const likedPostIds = new Set(userLikes.map(like => like.post?.toString()).filter(Boolean));
      const savedPostIds = new Set(userSaves.map(save => save.post?.toString()).filter(Boolean));

      posts = posts.map(post => ({
        ...post,
        isLiked: likedPostIds.has(post._id.toString()),
        isSaved: savedPostIds.has(post._id.toString()),
      }));
    }

    return posts;
  }

  /**
   * Get trending posts
   */
  static async getReelsFeed(page: number, limit: number, userId: string) {
    const skip = (page - 1) * limit;
    const excludedUserIds = await UserBlockService.getExcludedUserIds(userId.toString());

    // B1: Lấy reels cơ bản bằng aggregate
    const reels = await PostModel.aggregate([
      {
        $match: {
          type: "reel",
          isHidden: false,
          user: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $addFields: {
          score: {
            $add: [
              { $multiply: ["$likeCount", 3] },
              { $multiply: ["$commentCount", 5] },
              { $multiply: ["$shareCount", 4] },
              { $multiply: ["$viewCount", 0] },
              {
                $cond: [
                  { $gte: ["$createdAt", new Date(Date.now() - 1000 * 60 * 60 * 24)] },
                  1000,
                  0,
                ],
              },
            ],
          },
        },
      },
      // Lấy thông tin user bài đăng
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },

      // Lấy thông tin audio
      {
        $lookup: {
          from: "audios",
          localField: "audioId",
          foreignField: "_id",
          as: "audioInfo",
        },
      },
      {
        $unwind: {
          path: "$audioInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lấy thông tin user của audio
      {
        $lookup: {
          from: "users",
          localField: "audioInfo.user",
          foreignField: "_id",
          as: "audioUser",
        },
      },
      {
        $unwind: {
          path: "$audioUser",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          caption: 1,
          mediaUrls: 1,
          likeCount: 1,
          commentCount: 1,
          shareCount: 1,
          commentsDisabled: 1,
          likesHidden: 1,
          isHidden: 1,
          location: 1,
          tags: 1,
          mentions: 1,
          viewCount: 1,
          createdAt: 1,
          updatedAt: 1,
          audioId: 1,
          "audioInfo._id": 1,
          "audioInfo.title": 1,
          "audioInfo.artist": 1,
          "audioInfo.deezerId": 1,
          "audioInfo.fileUrl": 1,
          "audioInfo.cover": 1,
          "audioUser._id": 1,
          "audioUser.userId": 1,
          "audioUser.avatarUrl": 1,
          "user._id": "$userInfo._id",
          "user.userId": "$userInfo.userId",
          "user.avatar": "$userInfo.avatarUrl",
        },
      },
      { $sort: { score: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // B2: Lấy danh sách ID reels
    const reelIds = reels.map(r => r._id);

    // B3: Lấy danh sách user đã like hoặc save
    const [userLikes, userSaves] = await Promise.all([
      LikeModel.find({ user: userId, post: { $in: reelIds } }).select("post"),
      SavedPostModel.find({ user: userId, post: { $in: reelIds } }).select("post"),
    ]);

    const likedReelIds = new Set(
      userLikes
        .map(l => l.post)
        .filter((id): id is mongoose.Types.ObjectId => !!id) // ✅ đảm bảo id có giá trị
        .map(id => id.toString())
    );

    const savedReelIds = new Set(
      userSaves
        .map(s => s.post)
        .filter((id): id is mongoose.Types.ObjectId => !!id)
        .map(id => id.toString())
    );


    // B4: Thêm cờ isLiked / isSaved vào mỗi reel
    const reelsWithUserContext = reels.map(r => ({
      ...r,
      isLiked: likedReelIds.has(r._id.toString()),
      isSaved: savedReelIds.has(r._id.toString()),
    }));

    return reelsWithUserContext;
  }


  static async incrementViewCount(postId: string) {
    const post = await PostModel.findById(postId);
    if (!post) throw new Error("Post not found");

    await post.incrementView(); // 👈 dùng method có sẵn trong model
    return post.viewCount; // trả lại số lượt xem sau khi tăng
  }
}

// Legacy function for backward compatibility
export async function createPost(data: CreateNewPost) {
  return PostService.createPost(data);
}

export default PostService;
