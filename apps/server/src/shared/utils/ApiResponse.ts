// FILE: apps/server/src/shared/utils/ApiResponse.ts
// PURPOSE: Consistent success/error response formatters for all API routes
// DEPENDS ON: express
// LAST UPDATED: F04 - Express Server Base

import { Response } from "express";
import { ErrorCodeType } from "./ApiError";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SuccessResponseBody<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCodeType | string;
    message: string;
    details?: unknown;
  };
}

// ─────────────────────────────────────────────
// Success response sender
// ─────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>
): Response {
  const body: SuccessResponseBody<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(body);
}

// ─────────────────────────────────────────────
// Error response sender
// ─────────────────────────────────────────────

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCodeType | string,
  message: string,
  details?: unknown
): Response {
  const body: ErrorResponseBody = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  return res.status(statusCode).json(body);
}

// ─────────────────────────────────────────────
// Pagination helper
// ─────────────────────────────────────────────

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}