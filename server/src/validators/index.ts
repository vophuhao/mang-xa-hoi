/**
 * Central exports for all validators
 * This provides a clean import interface for controllers
 */

// Common validators
export * from "./common.validator";

// Authentication validators
export * from "./auth.validator";

// User validators
export * from "./user.validator";

// Post validators
export * from "./post.validator";

// Comment validators
export * from "./comment.validator";

// Message validators
export * from "./directMessage.validator";

/**
 * Usage examples:
 *
 * // In controllers:
 * import { loginSchema, createPostSchema, updateUserProfileSchema } from '@/validators';
 *
 * // Or specific imports:
 * import { loginSchema } from '@/validators/auth.validator';
 * import { createPostSchema } from '@/validators/post.validator';
 */
