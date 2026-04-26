// FILE: apps/server/src/modules/users/user.controller.ts
// PURPOSE: Handles user profile HTTP requests
// DEPENDS ON: express, user.service, ApiResponse, ApiError
// LAST UPDATED: F06 - Auth Middleware + Route Protection

import { Request, Response, NextFunction } from "express";
import * as UserService from "./user.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";

// ─────────────────────────────────────────────
// GET /api/v1/users/me
// ─────────────────────────────────────────────

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const user = await UserService.getUserProfile(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/v1/users/me
// ─────────────────────────────────────────────

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const user = await UserService.updateUserProfile(
      req.user.id,
      req.body as {
        name?: string;
        currencyPref?: string;
        timezone?: string;
      }
    );

    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/users/me/balances
// ─────────────────────────────────────────────

export async function getMyBalances(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const balances = await UserService.getUserBalances(
      req.user.id
    );

    sendSuccess(res, { balances });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/users/me/activity
// ─────────────────────────────────────────────

export async function getMyActivity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 30;

    const activities = await UserService.getUserActivity(
      req.user.id,
      limit
    );

    sendSuccess(res, activities);
  } catch (err) {
    next(err);
  }
}