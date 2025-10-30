import { z } from "zod";
import {
  bioSchema,
  imageUrlSchema,
  mongoIdSchema,
  nameSchema,
  paginationSchema,
  usernameSchema,
} from "./common.validator";

/**
 * User-related validation schemas
 */

// Update profile validation
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  userId: nameSchema.optional(),
  bio: bioSchema,
  avatarUrl: imageUrlSchema,
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

// Get user by username
export const getUserByUsernameSchema = z.object({
  username: usernameSchema,
});

// Get user by ID
export const getUserByIdSchema = z.object({
  id: mongoIdSchema,
});

// Get user by UserID
export const getUserByUserIdSchema = z.object({
  userId: z.string(),
});

// Follow/Unfollow user
export const followUserSchema = z.object({
  userId: mongoIdSchema,
});

// Search users
export const searchUsersSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(50, "Search query must be less than 50 characters")
    .trim(),
  ...paginationSchema.shape,
});

// Get user followers/following
export const getUserFollowersSchema = z.object({
  userId: mongoIdSchema,
  ...paginationSchema.shape,
});

export const getUserFollowingSchema = z.object({
  userId: mongoIdSchema,
  ...paginationSchema.shape,
});

// Block/Unblock user
export const blockUserSchema = z.object({
  userId: mongoIdSchema,
});

// Report user
export const reportUserSchema = z.object({
  userId: mongoIdSchema,
  reason: z.enum([
    "spam",
    "harassment",
    "hate_speech",
    "fake_account",
    "inappropriate_content",
    "other",
  ]),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

// Update user settings
export const updateUserSettingsSchema = z.object({
  isPrivate: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

// Export types
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
export type FollowUserInput = z.infer<typeof followUserSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type GetUserFollowersInput = z.infer<typeof getUserFollowersSchema>;
export type GetUserFollowingInput = z.infer<typeof getUserFollowingSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type ReportUserInput = z.infer<typeof reportUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
