// FILE: apps/web/src/stores/authStore.ts
// PURPOSE: Global Zustand store for authentication state
// DEPENDS ON: zustand, apiClient, setAccessToken
// LAST UPDATED: F09 Fix - Dashboard Route

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";
import { updateSocketAuth } from "@/lib/socket";
import { apiClient, setAccessToken, getAccessToken } from "@/lib/axios";

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

        // Persist user data for page reloads (sessionStorage — cleared on tab close)
        if (typeof window !== "undefined") {
          sessionStorage.setItem("splitsync_user", JSON.stringify(user));
          sessionStorage.setItem("splitsync_token", token);
        }

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

        // Clear sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("splitsync_user");
          sessionStorage.removeItem("splitsync_token");
        }

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

        // 1. Check sessionStorage first (survives page reload within same tab)
        if (typeof window !== "undefined") {
          const storedUser = sessionStorage.getItem("splitsync_user");
          const storedToken = sessionStorage.getItem("splitsync_token");

          if (storedUser && storedToken) {
            try {
              const user = JSON.parse(storedUser) as AuthUser;
              setAccessToken(storedToken);

              set(
                {
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  isInitialized: true,
                },
                false,
                "auth/initFromSession"
              );

              // Try to refresh in background (non-blocking)
              void fetch(
                `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}/auth/refresh`,
                { method: "POST", credentials: "include" }
              )
                .then((r) => r.json())
                .then((data: { success: boolean; data?: { accessToken: string; user: AuthUser } }) => {
                  if (data.success && data.data) {
                    setAccessToken(data.data.accessToken);
                    sessionStorage.setItem(
                      "splitsync_token",
                      data.data.accessToken
                    );
                  }
                })
                .catch(() => {
                  // Silent fail — user stays logged in from sessionStorage
                });

              return;
            } catch {
              // Invalid sessionStorage data — clear it
              sessionStorage.removeItem("splitsync_user");
              sessionStorage.removeItem("splitsync_token");
            }
          }
        }

        // 2. Try refresh token (works when same domain or cookies set)
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ??
            "http://localhost:5000/api/v1";

          const response = await fetch(`${apiUrl}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) throw new Error("Refresh failed");

          const data = (await response.json()) as {
            success: true;
            data: { user: AuthUser; accessToken: string };
          };

          const { user, accessToken } = data.data;
          setAccessToken(accessToken);

          if (typeof window !== "undefined") {
            sessionStorage.setItem("splitsync_user", JSON.stringify(user));
            sessionStorage.setItem("splitsync_token", accessToken);
          }

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