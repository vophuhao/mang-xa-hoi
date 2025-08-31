import { z } from "zod";
import { emailSchema, passwordSchema, usernameSchema } from "./common.validator";

/**
 * Authentication-related validation schemas
 */

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"), // Less strict for login
  userAgent: z.string().optional(),
});

// Registration validation
export const registerSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
    userAgent: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Email verification
export const emailVerificationSchema = z.object({
  email: emailSchema,
});

export const verificationCodeSchema = z
  .string()
  .min(1, "Verification code is required")
  .max(24, "Invalid verification code format");

export const verifyEmailSchema = z.object({
  code: verificationCodeSchema,
});

// Password reset
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    code: verificationCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Google OAuth
export const googleLoginSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  picture: z.string().url().optional(),
  googleId: z.string().min(1, "Google ID is required"),
});

// Change password (authenticated user)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Export types for better TypeScript integration
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
