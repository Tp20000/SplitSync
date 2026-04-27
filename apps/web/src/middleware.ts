// FILE: apps/web/src/middleware.ts
// PURPOSE: Minimal middleware — root redirect only
// Client-side auth guard handles route protection
// LAST UPDATED: F47 Fix - Cross-domain cookie issue

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle root path redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // Let everything else through
  // Client-side auth guard in (dashboard)/layout.tsx handles protection
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};