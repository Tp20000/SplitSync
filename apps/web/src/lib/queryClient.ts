// FILE: apps/web/src/lib/queryClient.ts
// PURPOSE: TanStack Query v5 client with global defaults
// DEPENDS ON: @tanstack/react-query
// LAST UPDATED: F07 - Next.js Frontend Setup

import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

// ─────────────────────────────────────────────
// Error type from our API
// ─────────────────────────────────────────────

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─────────────────────────────────────────────
// Extract error message from Axios error
// ─────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

// ─────────────────────────────────────────────
// Check if error is a specific API error code
// ─────────────────────────────────────────────

export function isApiError(
  error: unknown,
  code: string
): boolean {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error?.code === code;
  }
  return false;
}

// ─────────────────────────────────────────────
// Query Client singleton
// ─────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests twice
      retry: (failureCount, error) => {
        // Don't retry on 401, 403, 404
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (
            status === 401 ||
            status === 403 ||
            status === 404
          ) {
            return false;
          }
        }
        return failureCount < 2;
      },
      // Refetch on window focus in production
      refetchOnWindowFocus:
        process.env.NODE_ENV === "production",
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,
    },
  },
});