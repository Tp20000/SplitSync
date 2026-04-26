// FILE: apps/server/src/shared/middlewares/rateLimiter.middleware.ts
// PURPOSE: Rate limiting middleware — per-IP and per-user
// DEPENDS ON: express-rate-limit
// LAST UPDATED: F39 Fix - Use built-in memory store

import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { ErrorCode } from "../utils/ApiError";

// ─────────────────────────────────────────────
// Key generators
// ─────────────────────────────────────────────

function ipKeyGenerator(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)
      ?.split(",")[0]
      ?.trim() ??
    req.ip ??
    "unknown"
  );
}

function userKeyGenerator(req: Request): string {
  return req.user?.id ?? ipKeyGenerator(req);
}

// ─────────────────────────────────────────────
// Rate limit error response helper
// ─────────────────────────────────────────────

function makeHandler(message: string) {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message,
      },
    });
  };
}

// ─────────────────────────────────────────────
// GLOBAL RATE LIMITER
// 100 requests per minute per IP
// ─────────────────────────────────────────────

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  handler: makeHandler(
    "Too many requests. Please try again later."
  ),
  skip: (req: Request) =>
    req.path === "/health" ||
    req.path === "/api/v1/health",
});

// ─────────────────────────────────────────────
// AUTH RATE LIMITER
// 10 requests per minute per IP
// ─────────────────────────────────────────────

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  handler: makeHandler(
    "Too many authentication attempts. Please wait 1 minute."
  ),
});

// ─────────────────────────────────────────────
// STRICT AUTH LIMITER
// 5 requests per 15 minutes per IP
// For forgot-password / reset-password
// ─────────────────────────────────────────────

export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  handler: makeHandler(
    "Too many attempts. Please try again in 15 minutes."
  ),
});

// ─────────────────────────────────────────────
// API RATE LIMITER
// 60 requests per minute per user
// ─────────────────────────────────────────────

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  handler: makeHandler(
    "Too many requests. Please try again later."
  ),
});

// ─────────────────────────────────────────────
// UPLOAD RATE LIMITER
// 5 uploads per minute per user
// ─────────────────────────────────────────────

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKeyGenerator,
  handler: makeHandler(
    "Too many uploads. Please wait 1 minute."
  ),
});