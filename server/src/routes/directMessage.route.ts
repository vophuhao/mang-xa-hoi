import {
  sendMessageHandler,
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
import { Router } from "express";

const directMessageRoutes = Router();

// Protected routes - require authentication
directMessageRoutes.use(authenticate);

// Message CRUD
directMessageRoutes.post("/", sendMessageHandler);
directMessageRoutes.get("/conversations", getUserConversationsHandler);
directMessageRoutes.get("/conversation/:partnerId", getConversationHandler);
directMessageRoutes.get("/:messageId", getMessageByIdHandler);
directMessageRoutes.delete("/:messageId", deleteMessageHandler);

// Message interactions
directMessageRoutes.put("/:messageId/read", markAsReadHandler);
directMessageRoutes.put("/conversation/:partnerId/read-all", markAllAsReadHandler);
directMessageRoutes.post("/:messageId/react", reactToMessageHandler);
directMessageRoutes.delete("/:messageId/react", removeReactionHandler);

export default directMessageRoutes;