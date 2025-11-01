import type { Server } from "socket.io";

/**
 * Notification handler for Socket.IO events
 */
export class NotificationHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Emit new notification to specific user
   */
  emitNotification(userId: string, notification: any) {
    this.io.to(`u:${userId}`).emit("new_notification", notification);
  }

  /**
   * Emit notification read event
   */
  emitNotificationRead(userId: string, notificationId: string) {
    this.io.to(`u:${userId}`).emit("notification_read", { notificationId });
  }

  /**
   * Emit all notifications read event
   */
  emitAllNotificationsRead(userId: string) {
    this.io.to(`u:${userId}`).emit("all_notifications_read");
  }

  /**
   * Emit notification deleted event
   */
  emitNotificationDeleted(userId: string, notificationId: string) {
    this.io.to(`u:${userId}`).emit("notification_deleted", { notificationId });
  }

  /**
   * Emit unread count update
   */
  emitUnreadCountUpdate(userId: string, count: number) {
    this.io.to(`u:${userId}`).emit("unread_count_update", { count });
  }
}
