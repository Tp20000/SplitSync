// FILE: apps/server/src/modules/groups/group.validation.ts
// PURPOSE: Zod schemas for all group endpoints
// DEPENDS ON: zod
// LAST UPDATED: F10 - Groups CRUD API

import { z } from "zod";

// ─────────────────────────────────────────────
// Group types enum
// ─────────────────────────────────────────────

export const GROUP_TYPES = [
  "general",
  "trip",
  "home",
  "couple",
  "event",
  "other",
] as const;

export type GroupType = (typeof GROUP_TYPES)[number];

// ─────────────────────────────────────────────
// Create Group
// ─────────────────────────────────────────────

export const createGroupSchema = z.object({
  body: z.object({
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
    coverImage: z.string().url("Invalid URL").optional(),
  }),
});

// ─────────────────────────────────────────────
// Update Group
// ─────────────────────────────────────────────

export const updateGroupSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
  body: z
    .object({
      name: z
        .string()
        .min(2, "Group name must be at least 2 characters")
        .max(50, "Group name must be under 50 characters")
        .trim()
        .optional(),
      description: z
        .string()
        .max(200, "Description must be under 200 characters")
        .trim()
        .optional(),
      type: z.enum(GROUP_TYPES).optional(),
      coverImage: z.string().url("Invalid URL").optional(),
    })
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided" }
    ),
});

// ─────────────────────────────────────────────
// Join Group
// ─────────────────────────────────────────────

export const joinGroupSchema = z.object({
  body: z.object({
    inviteCode: z
      .string()
      .min(6, "Invalid invite code")
      .max(12, "Invalid invite code")
      .toUpperCase()
      .trim(),
  }),
});

// ─────────────────────────────────────────────
// Group ID param
// ─────────────────────────────────────────────

export const groupIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
  }),
});



// ─────────────────────────────────────────────
// Update Member Role
// ─────────────────────────────────────────────

export const updateMemberRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    userId: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    role: z.enum(["admin", "member"], {
      errorMap: () => ({ message: "Role must be admin or member" }),
    }),
  }),
});

// ─────────────────────────────────────────────
// Remove Member
// ─────────────────────────────────────────────

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid group ID"),
    userId: z.string().uuid("Invalid user ID"),
  }),
});

// ─────────────────────────────────────────────
// Inferred types (add to existing exports)
// ─────────────────────────────────────────────

export type UpdateMemberRoleInput = z.infer<
  typeof updateMemberRoleSchema
>;

export type CreateGroupInput = z.infer<
  typeof createGroupSchema
>["body"];

export type UpdateGroupInput = z.infer<
  typeof updateGroupSchema
>["body"];

export type JoinGroupInput = z.infer<
  typeof joinGroupSchema
>["body"];