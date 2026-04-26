// FILE: apps/server/src/config/env.ts
// PURPOSE: Validates all required environment variables at startup
//          Fails fast if anything is missing — prevents silent bugs
// DEPENDS ON: zod, dotenv
// LAST UPDATED: F04 - Express Server Base

import { z } from "zod";
import dotenv from "dotenv";

// Load .env file before validation
dotenv.config();

// ─────────────────────────────────────────────
// Environment schema — all variables with types
// ─────────────────────────────────────────────

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Frontend URL (for CORS)
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  // Cloudinary (optional until F34)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email (optional until F30)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

    // App URL
  APP_URL: z.string().default("http://localhost:3000"),
});

// ─────────────────────────────────────────────
// Parse and validate — exit process on failure
// ─────────────────────────────────────────────

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error("❌ [Env] Invalid environment variables:");
  console.error(
    JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2)
  );
  process.exit(1);
}

export const env = _parsed.data;

// ─────────────────────────────────────────────
// Derived helpers
// ─────────────────────────────────────────────

export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";