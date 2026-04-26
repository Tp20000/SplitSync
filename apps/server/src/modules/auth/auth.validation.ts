// FILE: apps/server/src/modules/auth/auth.validation.ts
// PURPOSE: Zod validation schemas for all auth endpoints
// DEPENDS ON: zod
// LAST UPDATED: F05 - Auth System

import { z } from "zod";

// ─────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  body: z.object({
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
      .max(72, "Password must be under 72 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    currencyPref: z.string().length(3).default("INR").optional(),
    timezone: z.string().default("Asia/Kolkata").optional(),
  }),
});

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase()
      .trim(),
    password: z.string().min(1, "Password is required"),
  }),
});

// ─────────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────────

export const refreshSchema = z.object({
  // Refresh token comes from httpOnly cookie
  // No body needed — validated in service
});

// ─────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase()
      .trim(),
  }),
});

// ─────────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be under 72 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
  }),
});

// ─────────────────────────────────────────────
// Inferred Types
// ─────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<
  typeof forgotPasswordSchema
>["body"];
export type ResetPasswordInput = z.infer<
  typeof resetPasswordSchema
>["body"];