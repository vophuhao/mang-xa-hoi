import { Router } from "express";
import {
  deleteNotificationHandler,
  getNotificationsHandler,
  getUnreadCountHandler,
  markAllAsReadHandler,
  markAsReadHandler,
} from "../controllers/notification.controller";
import authenticate from "../middleware/authenticate";

const notificationRoutes = Router();

// Protected routes - require authentication
notificationRoutes.use(authenticate);

// Get notifications
notificationRoutes.get("/", getNotificationsHandler);
notificationRoutes.get("/unread-count", getUnreadCountHandler);

// Mark as read
notificationRoutes.patch("/:notificationId/read", markAsReadHandler);
notificationRoutes.patch("/read-all", markAllAsReadHandler);

// Delete notifications
notificationRoutes.delete("/:notificationId", deleteNotificationHandler);

export default notificationRoutes;
