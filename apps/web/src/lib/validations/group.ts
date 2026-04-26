// FILE: apps/web/src/lib/validations/group.ts
// PURPOSE: Zod schemas for group forms — matches backend validation
// DEPENDS ON: zod
// LAST UPDATED: F11 - Groups Frontend

import { z } from "zod";

export const GROUP_TYPES = [
  "general",
  "trip",
  "home",
  "couple",
  "event",
  "other",
] as const;

// ─────────────────────────────────────────────
// Create Group Schema
// ─────────────────────────────────────────────

export const CreateGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(50, "Group name must be under 50 characters")
    .trim(),
  description: z
    .string()
    .max(200, "Description must be under 200 characters")
    .trim()
    .optional(),
  type: z.enum(GROUP_TYPES).default("general"),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

// ─────────────────────────────────────────────
// Join Group Schema
// ─────────────────────────────────────────────

export const JoinGroupSchema = z.object({
  inviteCode: z
    .string()
    .min(6, "Invite code must be at least 6 characters")
    .max(12, "Invalid invite code")
    .trim()
    .toUpperCase(),
});

export type JoinGroupInput = z.infer<typeof JoinGroupSchema>;