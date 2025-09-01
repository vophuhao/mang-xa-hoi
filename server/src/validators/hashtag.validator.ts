import { z } from "zod";

export const searchHashtagsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const getHashtagPostsSchema = z.object({
  hashtagName: z.string().min(1, "Hashtag name is required"),
});

export const createHashtagSchema = z.object({
  name: z
    .string()
    .min(1, "Hashtag name is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Hashtag can only contain letters, numbers, and underscores")
    .transform(val => val.toLowerCase().replace(/^#/, "")),
});

export const updateHashtagSchema = z.object({
  name: z
    .string()
    .min(1, "Hashtag name is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Hashtag can only contain letters, numbers, and underscores")
    .transform(val => val.toLowerCase().replace(/^#/, ""))
    .optional(),
  postCount: z.number().int().min(0).optional(),
});

export type SearchHashtagsInput = z.infer<typeof searchHashtagsSchema>;
export type GetHashtagPostsInput = z.infer<typeof getHashtagPostsSchema>;
export type CreateHashtagInput = z.infer<typeof createHashtagSchema>;
export type UpdateHashtagInput = z.infer<typeof updateHashtagSchema>;
