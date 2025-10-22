import { z } from "zod";

export const emailSchema = z.string().email().min(1).max(255);

//const passwordSchema = z.string().min(6).max(255);

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(255)
  .refine((val) => val.trim().length > 0, {
    message: "Password cannot be empty or only whitespace",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    username: z.string().min(2).max(100),
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verificationCodeSchema = z.string().min(1).max(24);

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: verificationCodeSchema,
});
