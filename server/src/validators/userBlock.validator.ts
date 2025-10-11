import { z } from "zod";

export const blockUserSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid user ID"),
  }),
});

export const getBlockedListSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});
