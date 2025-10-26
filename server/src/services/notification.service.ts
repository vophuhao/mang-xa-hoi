import FollowModel from "@/models/follow.model";
import NotificationModel from "@/models/notification.model";
import ErrorFactory from "@/utils/ErrorFactory";

export interface GetNotificationsParams {
  userId: string;
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

/**
 * Notification service containing all notification-related business logic
 */
export class NotificationService {
  /**
   * Get notifications for a user
   */
  static async getNotifications({
    userId,
    page = 1,
    limit = 20,
    unreadOnly = false,
  }: GetNotificationsParams) {
    const skip = (page - 1) * limit;

    const filter: any = { recipient: userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .populate("sender", "username userId avatarUrl isVerified")
        .populate("post", "_id mediaUrls mediaType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ recipient: userId, isRead: false }),
    ]);

    // Add isFollowing field to each notification's sender
    const senderIds = notifications.map((n: any) => n.sender?._id).filter(Boolean);
    const followingRelations = await FollowModel.find({
      follower: userId,
      following: { $in: senderIds },
    }).select("following");

    const followingSet = new Set(followingRelations.map((f: any) => f.following.toString()));

    const notificationsWithFollowStatus = notifications.map((notification: any) => {
      const notifObj = notification.toObject();
      if (notifObj.sender) {
        notifObj.sender.isFollowing = followingSet.has(notifObj.sender._id.toString());
      }
      return notifObj;
    });

    return {
      data: notificationsWithFollowStatus,
      unreadCount,
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
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await NotificationModel.findById(notificationId);

    if (!notification) {
      throw ErrorFactory.resourceNotFound("Notification");
    }

    // Verify user owns this notification
    if (notification.recipient.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions(
        "You can only mark your own notifications as read"
      );
    }

    if (notification.isRead) {
      return { message: "Notification already read", notification };
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return { message: "Notification marked as read", notification };
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    const result = await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return {
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await NotificationModel.findById(notificationId);

    if (!notification) {
      throw ErrorFactory.resourceNotFound("Notification");
    }

    // Verify user owns this notification
    if (notification.recipient.toString() !== userId) {
      throw ErrorFactory.insufficientPermissions("You can only delete your own notifications");
    }

    await NotificationModel.findByIdAndDelete(notificationId);

    return { message: "Notification deleted successfully" };
  }

  /**
   * Delete all notifications for a user
   */
  static async clearAllNotifications(userId: string) {
    const result = await NotificationModel.deleteMany({ recipient: userId });

    return {
      message: "All notifications cleared",
      deletedCount: result.deletedCount,
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    const unreadCount = await NotificationModel.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return { unreadCount };
  }

  /**
   * Create notification (helper method)
   */
  static async createNotification({
    recipient,
    sender,
    type,
    message,
    post,
    comment,
    story,
  }: {
    recipient: string;
    sender: string;
    type: string;
    message: string;
    post?: string;
    comment?: string;
    story?: string;
  }) {
    // Don't create notification for self-actions
    if (recipient === sender) {
      return null;
    }

    // Check if similar notification already exists (to prevent spam)
    const existingNotification = await NotificationModel.findOne({
      recipient,
      sender,
      type,
      post,
      comment,
      story,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Within last 5 minutes
    });

    if (existingNotification) {
      // Update existing notification timestamp instead of creating new one
      existingNotification.createdAt = new Date();
      existingNotification.isRead = false;
      await existingNotification.save();
      return existingNotification;
    }

    const notification = await NotificationModel.create({
      recipient,
      sender,
      type,
      message,
      post,
      comment,
      story,
    });

    await notification.populate("sender", "username userId avatarUrl isVerified");

    return notification;
  }

  /**
   * Create notification for post like
   */
  static async createLikeNotification({
    postId,
    postOwnerId,
    likerId,
  }: {
    postId: string;
    postOwnerId: string;
    likerId: string;
  }) {
    return this.createNotification({
      recipient: postOwnerId,
      sender: likerId,
      type: "like",
      message: "đã thích bài đăng của bạn",
      post: postId,
    });
  }

  /**
   * Create notification for comment
   */
  static async createCommentNotification({
    postId,
    postOwnerId,
    commenterId,
    commentId,
  }: {
    postId: string;
    postOwnerId: string;
    commenterId: string;
    commentId: string;
  }) {
    return this.createNotification({
      recipient: postOwnerId,
      sender: commenterId,
      type: "comment",
      message: "đã bình luận về bài đăng của bạn",
      post: postId,
      comment: commentId,
    });
  }

  /**
   * Create notification for comment reply
   */
  static async createReplyNotification({
    postId,
    parentCommentOwnerId,
    replierId,
    commentId,
  }: {
    postId: string;
    parentCommentOwnerId: string;
    replierId: string;
    commentId: string;
  }) {
    return this.createNotification({
      recipient: parentCommentOwnerId,
      sender: replierId,
      type: "reply",
      message: "đã trả lời bình luận của bạn",
      post: postId,
      comment: commentId,
    });
  }

  /**
   * Create notification for follow
   */
  static async createFollowNotification({
    followedUserId,
    followerId,
  }: {
    followedUserId: string;
    followerId: string;
  }) {
    return this.createNotification({
      recipient: followedUserId,
      sender: followerId,
      type: "follow",
      message: "đã bắt đầu theo dõi bạn",
    });
  }

  /**
   * Create notification for mention in post/comment
   */
  static async createMentionNotification({
    mentionedUserId,
    mentionerId,
    postId,
    commentId,
  }: {
    mentionedUserId: string;
    mentionerId: string;
    postId?: string;
    commentId?: string;
  }) {
    const notificationData: {
      recipient: string;
      sender: string;
      type: string;
      message: string;
      post?: string;
      comment?: string;
    } = {
      recipient: mentionedUserId,
      sender: mentionerId,
      type: "mention",
      message: commentId ? "mentioned you in a comment" : "mentioned you in a post",
    };

    if (postId) notificationData.post = postId;
    if (commentId) notificationData.comment = commentId;

    return this.createNotification(notificationData);
  }

  /**
   * Create notification for story view
   */
  static async createStoryViewNotification({
    storyOwnerId,
    viewerId,
    storyId,
  }: {
    storyOwnerId: string;
    viewerId: string;
    storyId: string;
  }) {
    return this.createNotification({
      recipient: storyOwnerId,
      sender: viewerId,
      type: "story_view",
      message: "viewed your story",
      story: storyId,
    });
  }

  /**
   * Create notification for post share
   */
  static async createShareNotification({
    postId,
    postOwnerId,
    sharerId,
  }: {
    postId: string;
    postOwnerId: string;
    sharerId: string;
  }) {
    return this.createNotification({
      recipient: postOwnerId,
      sender: sharerId,
      type: "post_share",
      message: "shared your post",
      post: postId,
    });
  }

  /**
   * Create or update notification for direct message
   * Groups multiple messages from same sender into one notification
   */
  static async createMessageNotification({
    recipientId,
    senderId,
    messageCount = 1,
  }: {
    recipientId: string;
    senderId: string;
    messageCount?: number;
  }) {
    // Don't create notification for self-messages
    if (recipientId === senderId) {
      return null;
    }

    // Find existing unread message notification from this sender
    const existingNotification = await NotificationModel.findOne({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      isRead: false,
    });

    if (existingNotification) {
      // Update existing notification - increment message count
      const currentCount = existingNotification.metadata?.messageCount || 1;
      const newCount = currentCount + messageCount;

      existingNotification.message = `đã gửi ${newCount} tin nhắn cho bạn`;
      existingNotification.metadata = { messageCount: newCount };
      existingNotification.createdAt = new Date(); // Update timestamp to move to top

      await existingNotification.save();
      return existingNotification;
    }

    // Create new notification
    return this.createNotification({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      message: `đã gửi ${messageCount} tin nhắn cho bạn`,
    });
  }

  /**
   * Get grouped notifications (e.g., "user1, user2 and 3 others liked your post")
   */
  static async getGroupedNotifications(userId: string) {
    const notifications = await NotificationModel.aggregate([
      {
        $match: {
          recipient: userId,
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            post: "$post",
            comment: "$comment",
            story: "$story",
          },
          notifications: { $push: "$$ROOT" },
          count: { $sum: 1 },
          latestDate: { $max: "$createdAt" },
          isRead: { $min: "$isRead" }, // false if any is unread
        },
      },
      {
        $sort: { latestDate: -1 },
      },
    ]);

    return notifications;
  }
}

export default NotificationService;
