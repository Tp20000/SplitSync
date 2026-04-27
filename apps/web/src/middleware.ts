// FILE: apps/web/src/middleware.ts
// PURPOSE: Route protection + redirect logic
// LAST UPDATED: F47 Fix

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ONLY_ROUTES = ["/login", "/register"];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/groups",
  "/balances",
  "/activity",
  "/analytics",
  "/settings",
  "/notifications",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasRefreshToken = request.cookies.has("refreshToken");

  // Root path → redirect based on auth
  if (pathname === "/") {
    if (hasRefreshToken) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // Already logged in → visiting login/register → go to dashboard
  if (hasRefreshToken && AUTH_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // Not logged in → visiting protected route → go to login
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};