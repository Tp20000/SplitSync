// FILE: apps/web/src/hooks/useAuth.ts
// PURPOSE: Auth actions hook — login, register, logout with TanStack Query
// DEPENDS ON: zustand authStore, apiClient, react-query
// LAST UPDATED: F09 - Auth State Management

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/lib/queryClient";
import type { AuthUser } from "@/types/auth";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthApiResponse {
  success: true;
  data: {
    user: AuthUser;
    accessToken: string;
  };
}

// ─────────────────────────────────────────────
// useLogin mutation
// ─────────────────────────────────────────────

export function useLogin() {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response =
        await apiClient.post<AuthApiResponse>("/auth/login", payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      // Use hard navigation to ensure full reload + auth init
      window.location.href = "/dashboard";
    },
  });
}

// ─────────────────────────────────────────────
// useRegister mutation
// ─────────────────────────────────────────────

export function useRegister() {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response =
        await apiClient.post<AuthApiResponse>("/auth/register", payload);
      return response.data.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      // Use hard navigation to ensure full reload + auth init
      window.location.href = "/dashboard";
    },
  });
}

// ─────────────────────────────────────────────
// useLogout
// ─────────────────────────────────────────────

export function useLogout() {
  const { logout } = useAuthStore();
  return { logout };
}

// ─────────────────────────────────────────────
// useCurrentUser — safe selector with helpers
// ─────────────────────────────────────────────

export function useCurrentUser() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
  };
}

// ─────────────────────────────────────────────
// useUpdateProfile mutation
// ─────────────────────────────────────────────

export function useUpdateProfile() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      currencyPref?: string;
      timezone?: string;
    }) => {
      const response = await apiClient.patch<{
        success: true;
        data: { user: AuthUser };
      }>("/users/me", payload);
      return response.data.data.user;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
    },
  });
}

// ─────────────────────────────────────────────
// Helper: extract error message from mutation
// ─────────────────────────────────────────────

export { getErrorMessage };