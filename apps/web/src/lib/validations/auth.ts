// FILE: apps/web/src/lib/validations/auth.ts
// PURPOSE: Zod schemas matching backend auth.validation.ts
// DEPENDS ON: zod
// LAST UPDATED: F08 - Login & Register Pages

import { z } from "zod";

// ─────────────────────────────────────────────
// Login Schema (matches backend)
// ─────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─────────────────────────────────────────────
// Register Schema (matches backend)
// ─────────────────────────────────────────────

export const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase letter, and number"
    ),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don not match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;