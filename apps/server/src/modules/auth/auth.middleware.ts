// FILE: apps/server/src/modules/auth/auth.middleware.ts
// PURPOSE: JWT authentication middleware + role-based access control
// DEPENDS ON: jsonwebtoken, express, env, ApiError, prisma
// LAST UPDATED: F06 - Auth Middleware + Route Protection

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { cacheGet, cacheSet } from "../../config/redis";
import prisma from "../../config/database";

// ─────────────────────────────────────────────
// JWT Payload shape (must match auth.service.ts)
// ─────────────────────────────────────────────

interface JwtAccessPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// AUTHENTICATE
// Verifies Bearer token → attaches req.user
// Use on ALL protected routes
// ─────────────────────────────────────────────

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized(
        "No access token provided",
        ErrorCode.UNAUTHORIZED
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized(
        "Malformed authorization header",
        ErrorCode.UNAUTHORIZED
      );
    }

    // 2. Verify JWT signature + expiry
    let payload: JwtAccessPayload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: "splitsync",
        audience: "splitsync-client",
      }) as JwtAccessPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized(
          "Access token expired",
          ErrorCode.TOKEN_EXPIRED
        );
      }
      throw ApiError.unauthorized(
        "Invalid access token",
        ErrorCode.INVALID_TOKEN
      );
    }

    // 3. Check Redis cache for user (avoid DB hit on every request)
    const cacheKey = `user:${payload.id}`;
    const cachedUser = await cacheGet<{
      id: string;
      email: string;
      name: string;
    }>(cacheKey);

    if (cachedUser) {
      req.user = cachedUser;
      next();
      return;
    }

    // 4. Verify user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw ApiError.unauthorized(
        "User account not found",
        ErrorCode.UNAUTHORIZED
      );
    }

    // 5. Cache user for 5 minutes
    await cacheSet(cacheKey, user, 300);

    // 6. Attach to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// OPTIONAL AUTH
// Attaches req.user if valid token exists
// Does NOT block request if token is missing
// Use on routes that behave differently when authed
// ─────────────────────────────────────────────

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      next();
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: "splitsync",
        audience: "splitsync-client",
      }) as JwtAccessPayload;

      // Try cache first
      const cacheKey = `user:${payload.id}`;
      const cachedUser = await cacheGet<{
        id: string;
        email: string;
        name: string;
      }>(cacheKey);

      if (cachedUser) {
        req.user = cachedUser;
        next();
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        await cacheSet(cacheKey, user, 300);
        req.user = user;
      }
    } catch {
      // Invalid token — just continue without user
    }

    next();
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// REQUIRE GROUP ROLE
// Must be used AFTER authenticate middleware
// Checks if req.user is a member of the group
// with the required role
// ─────────────────────────────────────────────

export function requireGroupRole(
  ...allowedRoles: string[]
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // authenticate() must run first
      if (!req.user) {
        throw ApiError.unauthorized();
      }

      const groupId =
        req.params.id ??
        req.params.groupId;

      if (!groupId) {
        throw ApiError.badRequest(
          "Group ID is required",
          ErrorCode.INVALID_INPUT
        );
      }

      // Check Redis cache for membership
      const cacheKey = `membership:${groupId}:${req.user.id}`;
      const cached = await cacheGet<{ role: string }>(cacheKey);

      if (cached) {
        if (
          allowedRoles.length > 0 &&
          !allowedRoles.includes(cached.role)
        ) {
          throw ApiError.forbidden(
            "You do not have the required role for this action",
            ErrorCode.NOT_GROUP_ADMIN
          );
        }
        next();
        return;
      }

      // Check DB for group membership
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
        select: { role: true },
      });

      if (!member) {
        throw ApiError.forbidden(
          "You are not a member of this group",
          ErrorCode.NOT_GROUP_MEMBER
        );
      }

      // Cache membership for 2 minutes
      await cacheSet(cacheKey, { role: member.role }, 120);

      // Check role if specific roles required
      if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(member.role)
      ) {
        throw ApiError.forbidden(
          "You do not have the required role for this action",
          ErrorCode.NOT_GROUP_ADMIN
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─────────────────────────────────────────────
// INVALIDATE USER CACHE
// Call this when user profile is updated
// so the cache is refreshed on next request
// ─────────────────────────────────────────────

export async function invalidateUserCache(
  userId: string
): Promise<void> {
  const { cacheDel } = await import("../../config/redis");
  await cacheDel(`user:${userId}`);
}

// ─────────────────────────────────────────────
// INVALIDATE MEMBERSHIP CACHE
// Call this when group membership changes
// ─────────────────────────────────────────────

export async function invalidateMembershipCache(
  groupId: string,
  userId: string
): Promise<void> {
  const { cacheDel } = await import("../../config/redis");
  await cacheDel(`membership:${groupId}:${userId}`);
}