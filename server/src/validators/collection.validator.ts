import { z } from "zod";

/**
 * Collection-related validation schemas
 */

// Create collection validation
export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .max(100, "Collection name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
  isPrivate: z.boolean().default(false),
});

// Update collection validation
export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Collection name is required")
    .max(100, "Collection name must be less than 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
  isPrivate: z.boolean().optional(),
});

// Collection ID param validation
export const collectionIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid collection ID"),
});

// Get collections query validation
export const getCollectionsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
  includePrivate: z
    .string()
    .optional()
    .transform(val => val === "true")
    .default("true"),
});

// Get collection posts query validation
export const getCollectionPostsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).default("12"),
});

// Add/remove post to/from collection params
export const collectionPostParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid collection ID"),
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid post ID"),
});

// Move post between collections params
export const movePostParamsSchema = z.object({
  fromId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid source collection ID"),
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid post ID"),
  toId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid target collection ID"),
});
