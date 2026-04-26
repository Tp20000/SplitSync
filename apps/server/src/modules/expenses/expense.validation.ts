// FILE: apps/server/src/modules/expenses/expense.validation.ts
// PURPOSE: Zod validation schemas for all expense endpoints
// DEPENDS ON: zod
// LAST UPDATED: F13 - Expense CRUD API

import { z } from "zod";

// ─────────────────────────────────────────────
// Split types + categories enums
// ─────────────────────────────────────────────

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

export type SplitType = (typeof SPLIT_TYPES)[number];
export type Category = (typeof CATEGORIES)[number];

// ─────────────────────────────────────────────
// Split entry — one per participant
// ─────────────────────────────────────────────

const splitEntrySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  // value meaning depends on splitType:
  //   equal:      ignored (calculated automatically)
  //   exact:      exact amount this person owes
  //   percentage: percentage (0-100) this person owes
  //   shares:     number of shares this person has
  value: z.number().min(0).optional(),
});

// ─────────────────────────────────────────────
// Create Expense
// ─────────────────────────────────────────────

export const createExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  body: z.object({
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
      .number()
      .positive("Amount must be greater than 0")
      .max(99999999.99, "Amount too large"),
    currency: z.string().length(3).default("INR"),
    category: z.enum(CATEGORIES).default("general"),
    splitType: z.enum(SPLIT_TYPES),
    splits: z
      .array(splitEntrySchema)
      .min(1, "At least one split participant is required"),
    paidBy: z.string().uuid("Invalid payer ID").optional(),
    expenseDate: z.string().datetime().optional(),
  }),
});

// ─────────────────────────────────────────────
// Update Expense
// ─────────────────────────────────────────────

export const updateExpenseSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    eid: z.string().uuid("Invalid expense ID"),
  }),
  body: z
    .object({
      title: z
        .string()
        .min(1, "Title is required")
        .max(100, "Title must be under 100 characters")
        .trim()
        .optional(),
      description: z
        .string()
        .max(500, "Description must be under 500 characters")
        .trim()
        .optional(),
      totalAmount: z
        .number()
        .positive("Amount must be greater than 0")
        .max(99999999.99, "Amount too large")
        .optional(),
      currency: z.string().length(3).optional(),
      category: z.enum(CATEGORIES).optional(),
      splitType: z.enum(SPLIT_TYPES).optional(),
      splits: z.array(splitEntrySchema).min(1).optional(),
      paidBy: z.string().uuid("Invalid payer ID").optional(),
      expenseDate: z.string().datetime().optional(),
      version: z.number().int().positive("Version required"),
    })
    .refine(
      (data) => {
        const { version, ...rest } = data;
        return Object.values(rest).some((v) => v !== undefined);
      },
      { message: "At least one field must be provided" }
    ),
});

// ─────────────────────────────────────────────
// Expense ID param
// ─────────────────────────────────────────────

export const expenseIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    eid: z.string().uuid("Invalid expense ID"),
  }),
});

// ─────────────────────────────────────────────
// List Expenses Query
// ─────────────────────────────────────────────

export const listExpensesQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
    category: z.string().optional(),
    paidBy: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "totalAmount", "expenseDate"])
      .optional()
      .default("expenseDate"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type CreateExpenseInput = z.infer<
  typeof createExpenseSchema
>["body"];

export type UpdateExpenseInput = z.infer<
  typeof updateExpenseSchema
>["body"];

export type ListExpensesQuery = z.infer<
  typeof listExpensesQuerySchema
>["query"];

export type SplitEntry = z.infer<typeof splitEntrySchema>;