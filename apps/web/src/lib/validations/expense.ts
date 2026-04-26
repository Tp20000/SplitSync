// FILE: apps/web/src/lib/validations/expense.ts
// PURPOSE: Zod schemas for expense forms — matches backend
// DEPENDS ON: zod
// LAST UPDATED: F14 - Expense Form UI

import { z } from "zod";

export const SPLIT_TYPES = [
  "equal",
  "exact",
  "percentage",
  "shares",
] as const;

export const CATEGORIES = [
  "general",
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "shopping",
  "utilities",
  "rent",
  "groceries",
  "drinks",
  "health",
  "education",
  "gifts",
  "travel",
  "other",
] as const;

export const CreateExpenseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be under 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be under 500 characters")
    .trim()
    .optional(),
  totalAmount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0")
    .max(99999999.99, "Amount too large"),
  category: z.enum(CATEGORIES).default("general"),
  splitType: z.enum(SPLIT_TYPES),
  paidBy: z.string().uuid().optional(),
  expenseDate: z.string().optional(),
});

export type CreateExpenseFormInput = z.infer<typeof CreateExpenseSchema>;