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
        .populate("sender", "username fullName avatarUrl isVerified")
        .populate("post", "_id mediaUrls mediaType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      data: notifications,
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

    await notification.populate("sender", "username fullName avatarUrl isVerified");

    return notification;
  }
}

export default NotificationService;
