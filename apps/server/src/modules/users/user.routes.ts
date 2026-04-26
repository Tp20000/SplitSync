// FILE: apps/server/src/modules/users/user.routes.ts
// PURPOSE: User profile route definitions — all protected
// DEPENDS ON: express, user.controller, auth.middleware, validate.middleware
// LAST UPDATED: F06 - Auth Middleware + Route Protection

import { Router } from "express";
import * as UserController from "./user.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import { updateProfileSchema } from "./user.validation";

const router = Router();

// ─────────────────────────────────────────────
// All user routes require authentication
// Apply authenticate middleware to all routes below
// ─────────────────────────────────────────────

router.use(authenticate);

// GET /api/v1/users/me
router.get("/me", UserController.getMe);

// PATCH /api/v1/users/me
router.patch(
  "/me",
  validate(updateProfileSchema),
  UserController.updateMe
);

// GET /api/v1/users/me/balances
router.get("/me/balances", UserController.getMyBalances);

// GET /api/v1/users/me/activity
router.get("/me/activity", UserController.getMyActivity);

export default router;