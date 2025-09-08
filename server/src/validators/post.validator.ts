import { z } from "zod";
import {
  contentSchema,
  imageUrlsSchema,
  mongoIdSchema,
  paginationSchema,
} from "./common.validator";

/**
 * Post-related validation schemas
 */

// Create post validation
export const createPostSchema = z.object({
  mediaUrls: imageUrlsSchema,
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag must be less than 50 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Tags can only contain letters, numbers, and underscores")
    )
    .max(10, "Maximum 10 tags allowed")
    .optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
});

// Update post validation
export const updatePostSchema = z.object({
  postId: mongoIdSchema,
  content: contentSchema.optional(),
  imageUrls: imageUrlsSchema,
  tags: z
    .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag must be less than 50 characters"))
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

// Get post by ID
export const getPostByIdSchema = z.object({
  id: mongoIdSchema,
});

// Delete post
export const deletePostSchema = z.object({
  id: mongoIdSchema,
});

// Like/Unlike post
export const likePostSchema = z.object({
  postId: mongoIdSchema,
});

// Save/Unsave post
export const savePostSchema = z.object({
  postId: mongoIdSchema,
});

// Get user posts
export const getUserPostsSchema = z.object({
  userId: mongoIdSchema,
  ...paginationSchema.shape,
});

// Get feed posts
export const getFeedPostsSchema = paginationSchema;

// Search posts
export const searchPostsSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query must be less than 100 characters")
    .trim(),
  tags: z
    .array(z.string().max(50, "Tag must be less than 50 characters"))
    .max(5, "Maximum 5 tags for search")
    .optional(),
  userId: mongoIdSchema.optional(),
  ...paginationSchema.shape,
});

// Get posts by tag
export const getPostsByTagSchema = z.object({
  tag: z.string().min(1, "Tag is required").max(50, "Tag must be less than 50 characters"),
  ...paginationSchema.shape,
});

// Report post
export const reportPostSchema = z.object({
  postId: mongoIdSchema,
  reason: z.enum([
    "spam",
    "harassment",
    "hate_speech",
    "violence",
    "inappropriate_content",
    "copyright",
    "misinformation",
    "other",
  ]),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// Export types
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetPostByIdInput = z.infer<typeof getPostByIdSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
export type LikePostInput = z.infer<typeof likePostSchema>;
export type SavePostInput = z.infer<typeof savePostSchema>;
export type GetUserPostsInput = z.infer<typeof getUserPostsSchema>;
export type GetFeedPostsInput = z.infer<typeof getFeedPostsSchema>;
export type SearchPostsInput = z.infer<typeof searchPostsSchema>;
export type GetPostsByTagInput = z.infer<typeof getPostsByTagSchema>;
export type ReportPostInput = z.infer<typeof reportPostSchema>;
