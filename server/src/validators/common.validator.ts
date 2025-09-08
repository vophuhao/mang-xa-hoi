import { z } from "zod";

/**
 * Common validation schemas used across the application
 */

// Basic field validators
export const emailSchema = z
  .string()
  .email("Please provide a valid email address")
  .min(1, "Email is required")
  .max(255, "Email must be less than 255 characters");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(255, "Password must be less than 255 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number"
  );

export const usernameSchema = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Pagination schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, "Page must be greater than 0"),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// File upload schemas
export const imageUrlSchema = z.string().url("Please provide a valid image URL");

export const imageUrlsSchema = z
  .array(imageUrlSchema)
  .min(1, "At least one image is required")
  .max(10, "Maximum 10 images allowed");

// Common text fields
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .trim();

export const bioSchema = z
  .string()
  .max(500, "Bio must be less than 500 characters")
  .trim()
  .optional();

export const contentSchema = z
  .string()
  .min(1, "Content is required")
  .max(2000, "Content must be less than 2000 characters")
  .trim();

// Date schemas
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Search schemas
export const searchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query must be less than 100 characters")
    .trim(),
  ...paginationSchema.shape,
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
