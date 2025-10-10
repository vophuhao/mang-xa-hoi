import CommentModel from "@/models/comment.model";
import LikeModel from "@/models/like.model";
import NotificationModel from "@/models/notification.model";
import PostModel from "@/models/post.model";
import ErrorFactory from "@/utils/ErrorFactory";

export interface CreateCommentParams {
  content: string;
  postId: string;
  userId: string;
  parentId?: string;
}

export interface UpdateCommentParams {
  content: string;
}

export interface GetCommentsParams {
  postId: string;
  page: number;
  limit: number;
  userId?: string;
}

/**
 * Comment service containing all comment-related business logic
 */
export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment({ content, postId, userId, parentId }: CreateCommentParams) {
    // Verify post exists
    const post = await PostModel.findById(postId);
    if (!post) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    // If it's a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await CommentModel.findById(parentId);
      if (!parentComment) {
        throw ErrorFactory.resourceNotFound("Parent comment");
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.post.toString() !== postId) {
        throw ErrorFactory.validationFailed("Parent comment does not belong to this post");
      }
    }

    // Create comment
    const comment = await CommentModel.create({
      content: content.trim(),
      post: postId,
      user: userId,
      parentComment: parentId || null,
    });

    // Increment comment count on post
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // Create notification for post owner (if not self-commenting)
    if (post.user.toString() !== userId) {
      await NotificationModel.create({
        recipient: post.user,
        sender: userId,
        type: "comment",
        post: postId,
        comment: comment._id,
        message: "commented on your post",
      });
    }

    // If it's a reply, create notification for parent comment author
    if (parentId) {
      const parentComment = await CommentModel.findById(parentId).populate("user");
      if (parentComment) {
        // Increment reply count on parent comment
        await parentComment.incrementReply();

        // Create notification if not replying to own comment
        if (parentComment.user._id.toString() !== userId) {
          await NotificationModel.create({
            recipient: parentComment.user._id,
            sender: userId,
            type: "reply",
            post: postId,
            comment: comment._id,
            message: "replied to your comment",
          });
        }
      }
    }

    // Populate user info for response
    await comment.populate("user", "username fullName avatarUrl");

    return comment;
  }

  /**
   * Get comments for a post with pagination
   */
  static async getComments({ postId, page = 1, limit = 10, userId }: GetCommentsParams) {
    // Verify post exists
    const postExists = await PostModel.exists({ _id: postId });
    if (!postExists) {
      throw ErrorFactory.resourceNotFound("Post");
    }

    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const [comments, total] = await Promise.all([
      CommentModel.find({
        post: postId,
        parentComment: null,
      })
        .populate("user", "username fullName avatarUrl isVerified")
        .populate({
          path: "replies",
          select: "content user createdAt",
          populate: {
            path: "user",
            select: "username fullName avatarUrl isVerified",
          },
          options: {
            limit: 3, // Only show first 3 replies
            sort: { createdAt: 1 },
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments({
        post: postId,
        parentComment: null,
      }),
    ]);

    // Add isLiked field for each comment if userId is provided
    let commentsWithLikeStatus = comments;
    if (userId) {
      const commentsWithLike = await Promise.all(
        comments.map(async comment => {
          const isLiked = await LikeModel.exists({
            user: userId,
            comment: comment._id,
          });

          return {
            ...comment.toObject(),
            isLiked: !!isLiked,
          };
        })
      );
      commentsWithLikeStatus = commentsWithLike as any;
    }

    return {
      data: commentsWithLikeStatus,
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
   * Get replies for a comment
   */
  static async getCommentReplies(
    commentId: string,
    page: number = 1,
    limit: number = 10,
    userId?: string
  ) {
    // Verify comment exists
    const parentComment = await CommentModel.findById(commentId);
    if (!parentComment) {
      throw ErrorFactory.resourceNotFound("Comment");
    }

    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      CommentModel.find({ parentComment: commentId })
        .populate("user", "username fullName avatarUrl isVerified")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      CommentModel.countDocuments({ parentComment: commentId }),
    ]);

    // Add isLiked field for each reply if userId is provided
    let repliesWithLikeStatus = replies;
    if (userId) {
      const repliesWithLike = await Promise.all(
        replies.map(async reply => {
          const isLiked = await LikeModel.exists({
            user: userId,
            comment: reply._id,
          });

          return {
            ...reply.toObject(),
            isLiked: !!isLiked,
          };
        })
      );
      repliesWithLikeStatus = repliesWithLike as any;
    }

    return {
      data: repliesWithLikeStatus,
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
   * Update a comment
   */
  static async updateComment(commentId: string, userId: string, { content }: UpdateCommentParams) {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw ErrorFactory.resourceNotFound("Comment");
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only edit your own comments");
    }

    comment.content = content.trim();
    await comment.save();

    await comment.populate("user", "username fullName avatarUrl");

    return comment;
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string, userId: string) {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw ErrorFactory.resourceNotFound("Comment");
    }

    // Check if user owns the comment or is post owner
    const post = await PostModel.findById(comment.post);
    const isCommentOwner = comment.user.toString() === userId;
    const isPostOwner = post?.user.toString() === userId;

    if (!isCommentOwner && !isPostOwner) {
      throw ErrorFactory.insufficientPermissions(
        "You can only delete your own comments or comments on your posts"
      );
    }

    // Delete all replies to this comment
    await CommentModel.deleteMany({ parentComment: commentId });

    // If this comment is a reply, decrement parent comment's reply count
    if (comment.parentComment) {
      const parentComment = await CommentModel.findById(comment.parentComment);
      if (parentComment) {
        await parentComment.decrementReply();
      }
    }

    // Delete the comment
    await CommentModel.findByIdAndDelete(commentId);

    // Decrement comment count on post
    const repliesCount = await CommentModel.countDocuments({ parentComment: commentId });
    const totalCommentsToDelete = repliesCount + 1; // replies + main comment

    await PostModel.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -totalCommentsToDelete },
    });

    // Remove related notifications
    await NotificationModel.deleteMany({
      $or: [{ comment: commentId }, { post: comment.post, sender: comment.user, type: "comment" }],
    });

    return { message: "Comment deleted successfully" };
  }

  /**
   * Like/unlike a comment
   */
  static async toggleCommentLike(commentId: string, userId: string) {
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      throw ErrorFactory.resourceNotFound("Comment");
    }

    // Check if user already liked this comment using LikeModel
    const existingLike = await LikeModel.findOne({
      user: userId,
      comment: commentId,
    });

    if (existingLike) {
      // Unlike - remove like and decrement count
      await LikeModel.findByIdAndDelete(existingLike._id);
      await comment.decrementLike();

      return {
        isLiked: false,
        likeCount: comment.likeCount,
        message: "Comment unliked",
      };
    } else {
      // Like - create like and increment count
      await LikeModel.create({
        user: userId,
        comment: commentId,
        type: "comment",
      });

      await comment.incrementLike();

      // Create notification for comment owner (if not self-liking)
      if (comment.user.toString() !== userId) {
        await NotificationModel.create({
          recipient: comment.user,
          sender: userId,
          type: "like",
          comment: commentId,
          post: comment.post,
          message: "liked your comment",
        });
      }

      return {
        isLiked: true,
        likeCount: comment.likeCount,
        message: "Comment liked",
      };
    }
  }
}

export default CommentService;
