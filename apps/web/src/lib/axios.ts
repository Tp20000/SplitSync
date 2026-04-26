// FILE: apps/web/src/lib/axios.ts
// PURPOSE: Configured Axios instance with auth interceptors + token refresh
// DEPENDS ON: axios
// LAST UPDATED: F12 Fix - Auth Refresh + Axios baseURL

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { updateSocketAuth } from "@/lib/socket";

// ─────────────────────────────────────────────
// Base URL resolution
// ─────────────────────────────────────────────
//
// Browser:     Use relative /api/v1 → proxied by Next.js to :5000
// Server-side: Use full URL directly → no proxy needed
//
// ─────────────────────────────────────────────

function getBaseURL(): string {
  // Always use direct backend URL
  // CORS is configured to allow localhost:3000
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:5000/api/v1"
  );
}

// ─────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────────
// In-memory access token
// ─────────────────────────────────────────────

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function processQueue(
  error: unknown,
  token: string | null = null
): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  refreshQueue = [];
}

// ─────────────────────────────────────────────
// Request interceptor — attach Bearer token
// ─────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Response interceptor — auto refresh on 401
// ─────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Always use relative path for refresh in browser
        const refreshURL =
          typeof window !== "undefined"
            ? "/api/v1/auth/refresh"
            : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"}/auth/refresh`;

        const { data } = await axios.post(
          refreshURL,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken as string;
        setAccessToken(newToken);
        updateSocketAuth(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;