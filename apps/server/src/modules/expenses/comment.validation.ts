// FILE: apps/server/src/modules/expenses/comment.validation.ts
// PURPOSE: Zod schemas for comment endpoints
// DEPENDS ON: zod
// LAST UPDATED: F28 - Comments on Expenses

import { z } from "zod";

export const createCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    eid: z.string().uuid("Invalid expense ID"),
  }),
  body: z.object({
    content: z
      .string()
      .min(1, "Comment cannot be empty")
      .max(500, "Comment must be under 500 characters")
      .trim(),
  }),
});

export const listCommentsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    eid: z.string().uuid("Invalid expense ID"),
  }),
});

export type CreateCommentInput = z.infer<
  typeof createCommentSchema
>["body"];