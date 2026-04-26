// FILE: apps/server/src/modules/auth/auth.routes.ts
// PURPOSE: Auth route definitions with validation middleware
// DEPENDS ON: express, auth.controller, auth.validation, validate.middleware
// LAST UPDATED: F05 - Auth System

import { Router } from "express";
import * as AuthController from "./auth.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { strictAuthLimiter } from "../../shared/middlewares/rateLimiter.middleware";

const router = Router();

// ─────────────────────────────────────────────
// Public auth routes (no auth required)
// ─────────────────────────────────────────────

// POST /api/v1/auth/register
router.post(
  "/register",
  validate(registerSchema),
  AuthController.register
);

// POST /api/v1/auth/login
router.post(
  "/login",
  validate(loginSchema),
  AuthController.login
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  AuthController.refresh
);

// POST /api/v1/auth/logout
router.post(
  "/logout",
  AuthController.logout
);

// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  strictAuthLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  strictAuthLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;