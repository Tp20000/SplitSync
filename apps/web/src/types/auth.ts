// FILE: apps/web/src/types/auth.ts
// PURPOSE: Shared TypeScript types for auth across frontend
// DEPENDS ON: none
// LAST UPDATED: F09 - Auth State Management

// ─────────────────────────────────────────────
// User shape returned by API
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currencyPref: string;
  timezone: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Auth API response shape
// ─────────────────────────────────────────────

export interface AuthResponse {
  success: true;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

// ─────────────────────────────────────────────
// API generic success response
// ─────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// ─────────────────────────────────────────────
// API generic error response
// ─────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}