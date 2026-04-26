// FILE: apps/web/src/middleware.ts
// PURPOSE: Protects dashboard routes — redirects based on cookie presence
// DEPENDS ON: next/server
// LAST UPDATED: F09 Fix - Middleware Routes

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// Route config
// ─────────────────────────────────────────────

// Routes that logged-in users should NOT visit
const AUTH_ONLY_ROUTES = ["/login", "/register"];

// Route prefixes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/groups",
  "/activity",
  "/analytics",
  "/settings",
];

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for refresh token cookie (set by backend)
  const hasRefreshToken = request.cookies.has("refreshToken");

  // ── 1. Already logged in → visiting login/register → go to dashboard
  if (hasRefreshToken && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // ── 2. Not logged in → visiting protected route → go to login
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!hasRefreshToken && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ─────────────────────────────────────────────
// Matcher — run on all routes except static files
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};