// FILE: apps/server/src/modules/auth/auth.controller.ts
// PURPOSE: Express route handlers for auth endpoints
// DEPENDS ON: express, auth.service, ApiResponse, ApiError
// LAST UPDATED: F05 - Auth System

import { Request, Response, NextFunction } from "express";
import * as AuthService from "./auth.service";
import { sendSuccess, sendError } from "../../shared/utils/ApiResponse";
import { ErrorCode } from "../../shared/utils/ApiError";

// ─────────────────────────────────────────────
// Cookie config for refresh token
// ─────────────────────────────────────────────

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production"
    ? "strict"
    : "lax") as "strict" | "lax",   // lax allows cross-port in dev
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// ─────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await AuthService.registerUser(req.body);

    // Set refresh token in httpOnly cookie
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS
    );

    sendSuccess(
      res,
      {
        user,
        accessToken: tokens.accessToken,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user, tokens } = await AuthService.loginUser(req.body);

    // Set refresh token in httpOnly cookie
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS
    );

    sendSuccess(res, {
      user,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Read refresh token from httpOnly cookie
    const rawRefreshToken = req.cookies?.refreshToken as
      | string
      | undefined;

    if (!rawRefreshToken) {
      sendError(
        res,
        401,
        ErrorCode.UNAUTHORIZED,
        "No refresh token provided"
      );
      return;
    }

    const { user, tokens } =
      await AuthService.refreshAccessToken(rawRefreshToken);

    // Rotate cookie with new refresh token
    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      REFRESH_COOKIE_OPTIONS
    );

    sendSuccess(res, {
      user,
      accessToken: tokens.accessToken,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/logout
// ─────────────────────────────────────────────

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.refreshToken as
      | string
      | undefined;

    if (rawRefreshToken) {
      await AuthService.logoutUser(rawRefreshToken);
    }

    // Clear cookie regardless
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (process.env.NODE_ENV === "production"
        ? "strict"
        : "lax") as "strict" | "lax",
      path: "/",
    });


    sendSuccess(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    await AuthService.forgotPassword(email);

    // Always return success (prevent user enumeration)
    sendSuccess(res, {
      message:
        "If an account exists with this email, a reset link has been sent",
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/v1/auth/reset-password
// ─────────────────────────────────────────────

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = req.body as {
      token: string;
      password: string;
    };
    await AuthService.resetPassword(token, password);

    sendSuccess(res, {
      message: "Password reset successfully. Please log in.",
    });
  } catch (err) {
    next(err);
  }
}