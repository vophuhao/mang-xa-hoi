import { z } from "zod";
import { contentSchema, mongoIdSchema, paginationSchema } from "./common.validator";

/**
 * Comment-related validation schemas
 */

// Create comment validation
export const createCommentSchema = z.object({
  postId: mongoIdSchema,
  content: contentSchema.max(1000, "Comment must be less than 1000 characters"),
  parentId: mongoIdSchema.optional(), // For reply comments
});

// Update comment validation
export const updateCommentSchema = z.object({
  commentId: mongoIdSchema,
  content: contentSchema.max(1000, "Comment must be less than 1000 characters"),
});

// Delete comment validation
export const deleteCommentSchema = z.object({
  commentId: mongoIdSchema,
});

// Get comment by ID
export const getCommentByIdSchema = z.object({
  id: mongoIdSchema,
});

// Like/Unlike comment
export const likeCommentSchema = z.object({
  commentId: mongoIdSchema,
});

// Get post comments
export const getPostCommentsSchema = z.object({
  postId: mongoIdSchema,
  ...paginationSchema.shape,
  sortBy: z.enum(["newest", "oldest", "likes"]).default("newest"),
  includeReplies: z
    .string()
    .optional()
    .default("false")
    .transform(val => val === "true"),
});

// Get comment replies
export const getCommentRepliesSchema = z.object({
  commentId: mongoIdSchema,
  ...paginationSchema.shape,
});

// Get user comments
export const getUserCommentsSchema = z.object({
  userId: mongoIdSchema,
  ...paginationSchema.shape,
});

// Report comment
export const reportCommentSchema = z.object({
  commentId: mongoIdSchema,
  reason: z.enum([
    "spam",
    "harassment",
    "hate_speech",
    "violence",
    "inappropriate_content",
    "misinformation",
    "other",
  ]),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// Pin/Unpin comment (for post authors)
export const pinCommentSchema = z.object({
  commentId: mongoIdSchema,
  postId: mongoIdSchema,
});

// Export types
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type GetCommentByIdInput = z.infer<typeof getCommentByIdSchema>;
export type LikeCommentInput = z.infer<typeof likeCommentSchema>;
export type GetPostCommentsInput = z.infer<typeof getPostCommentsSchema>;
export type GetCommentRepliesInput = z.infer<typeof getCommentRepliesSchema>;
export type GetUserCommentsInput = z.infer<typeof getUserCommentsSchema>;
export type ReportCommentInput = z.infer<typeof reportCommentSchema>;
export type PinCommentInput = z.infer<typeof pinCommentSchema>;
