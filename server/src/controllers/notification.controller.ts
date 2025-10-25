import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import NotificationService from "@/services/notification.service";
import { getNotificationHandler } from "@/socket";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";

/**
 * Get user's notifications
 * @route GET /notifications
 */
export const getNotificationsHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query as any;

    const result = await NotificationService.getNotifications({
      userId: (req.userId as any).toString(),
      page: Number(page),
      limit: Number(limit),
      unreadOnly: unreadOnly === "true",
    });

    return ResponseUtil.paginated(res, result.data, result.pagination);
  }
);

/**
 * Mark notification as read
 * @route PATCH /notifications/:notificationId/read
 */
export const markAsReadHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    throw new Error("Notification ID is required");
  }

  await NotificationService.markAsRead(notificationId, (req.userId as any).toString());

  // Emit Socket.IO event
  try {
    const notificationHandler = getNotificationHandler();
    notificationHandler.emitNotificationRead((req.userId as any).toString(), notificationId);

    // Update unread count
    const { unreadCount } = await NotificationService.getUnreadCount(
      (req.userId as any).toString()
    );
    notificationHandler.emitUnreadCountUpdate((req.userId as any).toString(), unreadCount);
  } catch (error) {
    console.error("Failed to emit notification read event:", error);
  }

  return ResponseUtil.success(res, null, "Notification marked as read");
});

/**
 * Mark all notifications as read
 * @route PATCH /notifications/read-all
 */
export const markAllAsReadHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    await NotificationService.markAllAsRead((req.userId as any).toString());

    // Emit Socket.IO event
    try {
      const notificationHandler = getNotificationHandler();
      notificationHandler.emitAllNotificationsRead((req.userId as any).toString());
      notificationHandler.emitUnreadCountUpdate((req.userId as any).toString(), 0);
    } catch (error) {
      console.error("Failed to emit all notifications read event:", error);
    }

    return ResponseUtil.success(res, null, "All notifications marked as read");
  }
);

/**
 * Delete a notification
 * @route DELETE /notifications/:notificationId
 */
export const deleteNotificationHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { notificationId } = req.params;

    if (!notificationId) {
      throw new Error("Notification ID is required");
    }

    await NotificationService.deleteNotification(notificationId, (req.userId as any).toString());

    // Emit Socket.IO event
    try {
      const notificationHandler = getNotificationHandler();
      notificationHandler.emitNotificationDeleted((req.userId as any).toString(), notificationId);

      // Update unread count
      const { unreadCount } = await NotificationService.getUnreadCount(
        (req.userId as any).toString()
      );
      notificationHandler.emitUnreadCountUpdate((req.userId as any).toString(), unreadCount);
    } catch (error) {
      console.error("Failed to emit notification deleted event:", error);
    }

    return ResponseUtil.success(res, null, "Notification deleted successfully");
  }
);

/**
 * Get unread notifications count
 * @route GET /notifications/unread-count
 */
export const getUnreadCountHandler = catchErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { unreadCount } = await NotificationService.getUnreadCount(
      (req.userId as any).toString()
    );

    return ResponseUtil.success(res, { count: unreadCount });
  }
);
