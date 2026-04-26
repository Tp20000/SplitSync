// FILE: apps/server/src/modules/settlements/settlement.validation.ts
// PURPOSE: Zod schemas for settlement endpoints
// DEPENDS ON: zod
// LAST UPDATED: F25 - Settlement Recording API

import { z } from "zod";

// ─────────────────────────────────────────────
// Create Settlement
// ─────────────────────────────────────────────

export const createSettlementSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  body: z.object({
    paidTo: z.string().uuid("Invalid recipient ID"),
    amount: z
      .number()
      .positive("Amount must be greater than 0")
      .max(99999999.99, "Amount too large"),
    currency: z.string().length(3).default("INR"),
    note: z
      .string()
      .max(200, "Note must be under 200 characters")
      .trim()
      .optional(),
  }),
});

// ─────────────────────────────────────────────
// List Settlements
// ─────────────────────────────────────────────

export const listSettlementsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
  }),
});

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type CreateSettlementInput = z.infer<
  typeof createSettlementSchema
>["body"];

export type ListSettlementsQuery = z.infer<
  typeof listSettlementsSchema
>["query"];