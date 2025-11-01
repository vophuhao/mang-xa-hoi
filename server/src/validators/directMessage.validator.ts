import { z } from "zod";
import {
  mongoIdSchema,
  paginationSchema,
} from "./common.validator";

/**
 * DirectMessage-related validation schemas
 */

// Send message validation
export const sendMessageSchema = z.object({
  recipientId: mongoIdSchema,
  content: z
    .string()
    .max(1000, "Message content must be less than 1000 characters")
    .optional(),
  messageType: z
    .enum(["text", "media", "post_share", "story_share", "location", "voice", "call"])
    .default("text"),
  mediaUrl: z
    .string()
    .url("Invalid media URL")
    .optional(),
  mediaType: z
    .enum(["image", "video", "audio"])
    .optional(),
  sharedPost: mongoIdSchema.optional(),
  sharedStory: mongoIdSchema.optional(),
  location: z
    .object({
      name: z.string().min(1, "Location name is required").max(100, "Location name must be less than 100 characters"),
      coordinates: z
        .tuple([z.number(), z.number()]) // Sử dụng z.tuple thay vì z.array
        .refine(
          ([lng, lat]) => {
            return lng >= -180 && lng <= 180 && 
                   lat >= -90 && lat <= 90;
          },
          "Invalid coordinates: longitude must be between -180 and 180, latitude between -90 and 90"
        ),
    })
    .optional(),
  replyTo: mongoIdSchema.optional(),
  callData: z.object({
    duration: z.number().optional(),
    status: z.enum(["incoming", "outgoing", "declined"]), // ✅ CHỈ 3 status
    roomId: z.string(),
    startedAt: z.date().optional(),
    endedAt: z.date().optional(),
  }).optional(),
}).refine(
  (data) => {
    // Text message must have content
    if (data.messageType === "text" && !data.content?.trim()) {
      return false;
    }
    // Media message must have mediaUrl and mediaType
    if (data.messageType === "media" && (!data.mediaUrl || !data.mediaType)) {
      return false;
    }
    // Post share must have sharedPost
    if (data.messageType === "post_share" && !data.sharedPost) {
      return false;
    }
    // Story share must have sharedStory
    if (data.messageType === "story_share" && !data.sharedStory) {
      return false;
    }
    // Location must have location object
    if (data.messageType === "location" && !data.location) {
      return false;
    }
    // Voice message must have mediaUrl
    if (data.messageType === "voice" && !data.mediaUrl) {
      return false;
    }
    return true;
  },
  {
    message: "Message content does not match the message type requirements",
  }
);

// Get conversation validation
export const getConversationSchema = z.object({
  partnerId: mongoIdSchema,
});

// Get conversations list validation
export const getUserConversationsSchema = paginationSchema;

// Mark message as read validation
export const markAsReadSchema = z.object({
  messageId: mongoIdSchema,
});

// Mark all messages as read validation
export const markAllAsReadSchema = z.object({
  partnerId: mongoIdSchema,
});

// React to message validation
export const reactToMessageSchema = z.object({
  emoji: z
    .string()
    .min(1, "Emoji is required")
    .max(10, "Emoji must be less than 10 characters")
    .regex(/^\p{Emoji}+$/u, "Invalid emoji format"),
});

// Remove reaction validation
export const removeReactionSchema = z.object({
  messageId: mongoIdSchema,
});

// Delete message validation
export const deleteMessageSchema = z.object({
  messageId: mongoIdSchema,
});

// Get message by ID validation
export const getMessageByIdSchema = z.object({
  messageId: mongoIdSchema,
});

// Search messages validation
export const searchMessagesSchema = z.object({
  partnerId: mongoIdSchema,
  query: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query must be less than 100 characters")
    .trim(),
  ...paginationSchema.shape,
});

// Get media messages validation
export const getMediaMessagesSchema = z.object({
  partnerId: mongoIdSchema,
  mediaType: z
    .enum(["image", "video", "audio"])
    .optional(),
  ...paginationSchema.shape,
});

// Report message validation
export const reportMessageSchema = z.object({
  messageId: mongoIdSchema,
  reason: z.enum([
    "spam",
    "harassment",
    "hate_speech",
    "violence",
    "inappropriate_content",
    "scam",
    "fake_information",
    "other",
  ]),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

// Forward message validation
export const forwardMessageSchema = z.object({
  messageId: mongoIdSchema,
  recipientIds: z
    .array(mongoIdSchema)
    .min(1, "At least one recipient is required")
    .max(10, "Maximum 10 recipients allowed"),
});

// Schema cho call history
export const saveCallHistorySchema = z.object({
  recipientId: z.string().min(1, "Recipient ID is required"),
  status: z.enum(["incoming", "outgoing", "declined"]),
  roomId: z.string().min(1, "Room ID is required"),
  duration: z.number().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
});

export const updateCallStatusSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  status: z.enum(["incoming", "outgoing", "declined"]),
  duration: z.number().optional(),
  endedAt: z.string().datetime().optional(),
});

// Export types
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetConversationInput = z.infer<typeof getConversationSchema>;
export type GetUserConversationsInput = z.infer<typeof getUserConversationsSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type MarkAllAsReadInput = z.infer<typeof markAllAsReadSchema>;
export type ReactToMessageInput = z.infer<typeof reactToMessageSchema>;
export type RemoveReactionInput = z.infer<typeof removeReactionSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type GetMessageByIdInput = z.infer<typeof getMessageByIdSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
export type GetMediaMessagesInput = z.infer<typeof getMediaMessagesSchema>;
export type ReportMessageInput = z.infer<typeof reportMessageSchema>;
export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;
export type SaveCallHistoryInput = z.infer<typeof saveCallHistorySchema>;
export type UpdateCallStatusInput = z.infer<typeof updateCallStatusSchema>;