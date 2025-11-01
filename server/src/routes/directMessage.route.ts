import { Router } from "express";

import {
  sendMessageHandler,
  saveCallHistoryHandler,
  updateCallStatusHandler,
  getConversationHandler,
  getUserConversationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  reactToMessageHandler,
  removeReactionHandler,
  deleteMessageHandler,
  getMessageByIdHandler,
} from "@/controllers/directMessage.controller";
import authenticate from "@/middleware/authenticate";

const router = Router();

// Protected routes - require authentication
router.use(authenticate);

// Message CRUD
router.post("/", sendMessageHandler);
router.get("/conversations", getUserConversationsHandler);
router.get("/conversation/:partnerId", getConversationHandler);
router.get("/:messageId", getMessageByIdHandler);
router.delete("/:messageId", deleteMessageHandler);

// Message interactions
router.put("/:messageId/read", markAsReadHandler);
router.put("/conversation/:partnerId/read-all", markAllAsReadHandler);
router.post("/:messageId/react", reactToMessageHandler);
router.delete("/:messageId/react", removeReactionHandler);

// ✅ THÊM Call history routes
router.post("/call-history", authenticate, saveCallHistoryHandler);
router.put("/call/:roomId/status", authenticate, updateCallStatusHandler);

export default router;