// FILE: apps/server/src/modules/expenses/recurring.validation.ts
// PURPOSE: Zod schemas for recurring expense endpoints
// DEPENDS ON: zod
// LAST UPDATED: F31 Fix - Validation

import { z } from "zod";
import { SPLIT_TYPES, CATEGORIES } from "./expense.validation";

export const FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
] as const;

export type Frequency = (typeof FREQUENCIES)[number];

// ─────────────────────────────────────────────
// Create Recurring Rule
// ─────────────────────────────────────────────

export const createRecurringSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  body: z.object({
    // Template data
    title: z
      .string()
      .min(1, "Title is required")
      .max(100)
      .trim(),
    description: z.string().max(500).trim().optional(),
    totalAmount: z
      .number()
      .positive("Amount must be greater than 0"),
    currency: z.string().length(3).default("INR"),
    category: z.enum(CATEGORIES).default("general"),
    splitType: z.enum(SPLIT_TYPES),
    splits: z
      .array(
        z.object({
          userId: z.string().uuid(),
          value: z.number().min(0).optional(),
        })
      )
      .min(1),
    paidBy: z
      .string()
      .uuid()
      .optional()
      .or(z.literal("")),  // Allow empty string

    // Recurring config
    frequency: z.enum(FREQUENCIES),
    // Accept any date string — we parse it in the service
    startDate: z.string().optional(),
  }),
});

// ─────────────────────────────────────────────
// Update Recurring Rule
// ─────────────────────────────────────────────

export const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    rid: z.string().uuid("Invalid rule ID"),
  }),
  body: z
    .object({
      isActive: z.boolean().optional(),
      title: z.string().min(1).max(100).trim().optional(),
      totalAmount: z.number().positive().optional(),
      frequency: z.enum(FREQUENCIES).optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided" }
    ),
});

// ─────────────────────────────────────────────
// Rule ID param
// ─────────────────────────────────────────────

export const recurringIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    rid: z.string().uuid("Invalid rule ID"),
  }),
});

export type CreateRecurringInput = z.infer<
  typeof createRecurringSchema
>["body"];

export type UpdateRecurringInput = z.infer<
  typeof updateRecurringSchema
>["body"];