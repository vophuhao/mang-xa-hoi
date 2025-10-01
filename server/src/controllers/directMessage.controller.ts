import type { AuthenticatedRequest } from "@/types";
import type { Response } from "express";

import DirectMessageService from "@/services/directMessage.service";
import catchErrors from "@/utils/catchErrors";
import { ResponseUtil } from "@/utils/response";
import {
  sendMessageSchema,
  getConversationSchema,
  markAsReadSchema,
  reactToMessageSchema,
  getMessageByIdSchema,
  deleteMessageSchema,
  getUserConversationsSchema,
  markAllAsReadSchema,
} from "@/validators";

/**
 * Send a new message
 * @route POST /messages
 */
export const sendMessageHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = sendMessageSchema.parse(req.body);

  const message = await DirectMessageService.sendMessage({
    senderId: (req.userId as any).toString(),
    recipientId: validatedData.recipientId,
    content: validatedData.content,
    messageType: validatedData.messageType || "text",
    mediaUrl: validatedData.mediaUrl,
    mediaType: validatedData.mediaType,
    sharedPost: validatedData.sharedPost,
    sharedStory: validatedData.sharedStory,
    location: validatedData.location,
    replyTo: validatedData.replyTo,
  });

  return ResponseUtil.created(res, message, "Message sent successfully");
});

/**
 * Get conversation between two users
 * @route GET /messages/conversation/:partnerId
 */
export const getConversationHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { partnerId } = getConversationSchema.parse(req.params);
  const { page = 1, limit = 10 } = req.query as any;

  const result = await DirectMessageService.getConversation({
    userId: (req.userId as any).toString(),
    partnerId,
    page: Number(page),
    limit: Number(limit),
  });

  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Get user's conversations list
 * @route GET /messages/conversations
 */
export const getUserConversationsHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 20 } = getUserConversationsSchema.parse(req.query);

  const result = await DirectMessageService.getUserConversations(
    (req.userId as any).toString(),
    Number(page),
    Number(limit)
  );

  return ResponseUtil.paginated(res, result.data, result.pagination);
});

/**
 * Mark message as read
 * @route PUT /messages/:messageId/read
 */
export const markAsReadHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = markAsReadSchema.parse(req.params);

  const result = await DirectMessageService.markAsRead(messageId, (req.userId as any).toString());

  return ResponseUtil.success(res, result.data, result.message);
});

/**
 * Mark all messages as read
 * @route PUT /messages/conversation/:partnerId/read-all
 */
export const markAllAsReadHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { partnerId } = markAllAsReadSchema.parse(req.params);

  const result = await DirectMessageService.markAllAsRead(
    (req.userId as any).toString(),
    partnerId
  );

  return ResponseUtil.success(res, { modifiedCount: result.modifiedCount }, result.message);
});

/**
 * React to message
 * @route POST /messages/:messageId/react
 */
export const reactToMessageHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = reactToMessageSchema.parse(req.body);

  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const result = await DirectMessageService.reactToMessage({
    messageId,
    userId: (req.userId as any).toString(),
    emoji,
  });

  return ResponseUtil.success(res, result.data, result.message);
});

/**
 * Remove reaction from message
 * @route DELETE /messages/:messageId/react
 */
export const removeReactionHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;

  if (!messageId) {
    throw new Error("Message ID is required");
  }

  const result = await DirectMessageService.removeReaction(
    messageId,
    (req.userId as any).toString()
  );

  return ResponseUtil.success(res, result.data, result.message);
});

/**
 * Delete message
 * @route DELETE /messages/:messageId
 */
export const deleteMessageHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = deleteMessageSchema.parse(req.params);

  await DirectMessageService.deleteMessage(messageId, (req.userId as any).toString());

  return ResponseUtil.success(res, null, "Message deleted successfully");
});

/**
 * Get message by ID
 * @route GET /messages/:messageId
 */
export const getMessageByIdHandler = catchErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = getMessageByIdSchema.parse(req.params);

  const message = await DirectMessageService.getMessageById(
    messageId,
    (req.userId as any).toString()
  );

  return ResponseUtil.success(res, message, "Message retrieved successfully");
});