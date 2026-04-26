// FILE: apps/server/src/shared/utils/ApiError.ts
// PURPOSE: Custom error class for consistent API error responses
// DEPENDS ON: None
// LAST UPDATED: F04 - Express Server Base

// ─────────────────────────────────────────────
// Standard error codes used across the app
// ─────────────────────────────────────────────

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Groups
  NOT_GROUP_MEMBER: "NOT_GROUP_MEMBER",
  NOT_GROUP_ADMIN: "NOT_GROUP_ADMIN",
  INVALID_INVITE_CODE: "INVALID_INVITE_CODE",
  ALREADY_GROUP_MEMBER: "ALREADY_GROUP_MEMBER",

  // Expenses
  INSUFFICIENT_SPLIT: "INSUFFICIENT_SPLIT",
  SPLIT_MISMATCH: "SPLIT_MISMATCH",
  EXPENSE_LOCKED: "EXPENSE_LOCKED",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─────────────────────────────────────────────
// ApiError class
// ─────────────────────────────────────────────

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    code: ErrorCodeType,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Static factories for common errors ───

  static badRequest(
    message: string,
    code: ErrorCodeType = ErrorCode.INVALID_INPUT,
    details?: unknown
  ): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(
    message = "Authentication required",
    code: ErrorCodeType = ErrorCode.UNAUTHORIZED
  ): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(
    message = "You do not have permission to perform this action",
    code: ErrorCodeType = ErrorCode.FORBIDDEN
  ): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(
    resource = "Resource",
    code: ErrorCodeType = ErrorCode.NOT_FOUND
  ): ApiError {
    return new ApiError(404, code, `${resource} not found`);
  }

  static conflict(
    message: string,
    code: ErrorCodeType = ErrorCode.CONFLICT
  ): ApiError {
    return new ApiError(409, code, message);
  }

  static internal(
    message = "Internal server error"
  ): ApiError {
    return new ApiError(
      500,
      ErrorCode.INTERNAL_ERROR,
      message,
      undefined,
      false
    );
  }

  static validation(
    message: string,
    details?: unknown
  ): ApiError {
    return new ApiError(
      422,
      ErrorCode.VALIDATION_ERROR,
      message,
      details
    );
  }
}