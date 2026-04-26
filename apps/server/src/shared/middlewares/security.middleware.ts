// FILE: apps/server/src/shared/middlewares/security.middleware.ts
// PURPOSE: Additional security headers beyond Helmet
// DEPENDS ON: express
// LAST UPDATED: F39 - Rate Limiting + Security Headers

import { Request, Response, NextFunction } from "express";

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent page from being loaded in iframe (clickjacking)
  res.setHeader("X-Frame-Options", "DENY");

  // Disable caching for API responses
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Permissions policy — restrict browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  next();
}