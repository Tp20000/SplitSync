// FILE: apps/server/src/shared/middlewares/error.middleware.ts
// PURPOSE: Global Express error handler — catches all thrown errors
// DEPENDS ON: express, ApiError, ApiResponse, logger
// LAST UPDATED: F04 - Express Server Base

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError, ErrorCode } from "../utils/ApiError";
import { sendError } from "../utils/ApiResponse";
import { logger } from "../utils/logger";
import { isDev } from "../../config/env";

// ─────────────────────────────────────────────
// Global error handler
// Must have 4 params for Express to recognize it
// ─────────────────────────────────────────────

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── 1. Known operational error (ApiError) ──
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error("[ApiError]", {
        code: err.code,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    } else {
      logger.warn("[ApiError]", {
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    }

    sendError(
      res,
      err.statusCode,
      err.code,
      err.message,
      isDev ? err.details : undefined
    );
    return;
  }

  // ── 2. Zod validation error ──
  if (err instanceof ZodError) {
    logger.warn("[ValidationError]", {
      errors: err.flatten(),
      path: req.path,
      method: req.method,
    });

    sendError(
      res,
      422,
      ErrorCode.VALIDATION_ERROR,
      "Validation failed",
      err.flatten().fieldErrors
    );
    return;
  }

  // ── 3. Prisma known errors ──
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as Error & { code?: string };

    // Unique constraint violation
    if (prismaErr.code === "P2002") {
      sendError(
        res,
        409,
        ErrorCode.ALREADY_EXISTS,
        "A record with this value already exists"
      );
      return;
    }

    // Record not found
    if (prismaErr.code === "P2025") {
      sendError(res, 404, ErrorCode.NOT_FOUND, "Record not found");
      return;
    }
  }

  // ── 4. Unknown / unexpected error ──
  logger.error("[UnhandledError]", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  sendError(
    res,
    500,
    ErrorCode.INTERNAL_ERROR,
    isDev ? err.message : "An unexpected error occurred"
  );
}