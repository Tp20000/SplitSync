// FILE: apps/web/src/stores/authStore.ts
// PURPOSE: Global Zustand store for authentication state
// DEPENDS ON: zustand, apiClient, setAccessToken
// LAST UPDATED: F09 Fix - Dashboard Route

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient, setAccessToken } from "@/lib/axios";
import type { AuthUser } from "@/types/auth";
import { updateSocketAuth } from "@/lib/socket";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      setUser: (user: AuthUser, token: string) => {
        setAccessToken(token);
        updateSocketAuth(token);
        set(
          {
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "auth/setUser"
        );
      },

      clearAuth: () => {
        setAccessToken(null);
        set(
          {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "auth/clearAuth"
        );
      },

      logout: async () => {
        try {
          await apiClient.post("/auth/logout");
        } catch {
          // Continue logout even if API fails
        } finally {
          get().clearAuth();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      },

      updateUser: (updates: Partial<AuthUser>) => {
        const current = get().user;
        if (!current) return;
        set(
          { user: { ...current, ...updates } },
          false,
          "auth/updateUser"
        );
      },

      // ── Initialize: try to restore session from refresh token ──
      initializeAuth: async () => {
        if (get().isInitialized) return;

        set({ isLoading: true }, false, "auth/initStart");

        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ??
            "http://localhost:5000/api/v1";

          const response = await fetch(`${apiUrl}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Refresh failed: ${response.status}`);
          }

          const data = (await response.json()) as {
            success: true;
            data: {
              user: AuthUser;
              accessToken: string;
            };
          };

          const { user, accessToken } = data.data;
          setAccessToken(accessToken);

          set(
            {
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            },
            false,
            "auth/initSuccess"
          );
        } catch {
          setAccessToken(null);
          set(
            {
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            },
            false,
            "auth/initFailed"
          );
        }
      },
    }),
    {
      name: "splitsync-auth",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// ─────────────────────────────────────────────
// Selector hooks
// ─────────────────────────────────────────────

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () =>
  useAuthStore((s) => s.isAuthenticated);
export const useIsAuthLoading = () =>
  useAuthStore((s) => s.isLoading);
export const useIsAuthInitialized = () =>
  useAuthStore((s) => s.isInitialized);