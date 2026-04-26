// FILE: apps/server/src/modules/users/user.validation.ts
// PURPOSE: Zod schemas for user profile endpoints
// DEPENDS ON: zod
// LAST UPDATED: F06 - Auth Middleware + Route Protection

import { z } from "zod";

// ─────────────────────────────────────────────
// Update Profile
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be under 50 characters")
        .trim()
        .optional(),
      currencyPref: z
        .string()
        .length(3, "Currency must be a 3-letter code")
        .toUpperCase()
        .optional(),
      timezone: z
        .string()
        .min(1, "Timezone is required")
        .optional(),
    })
    .refine(
      (data) =>
        Object.values(data).some((v) => v !== undefined),
      { message: "At least one field must be provided" }
    ),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>["body"];