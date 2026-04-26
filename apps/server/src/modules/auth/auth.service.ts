// FILE: apps/server/src/modules/auth/auth.service.ts
// PURPOSE: Auth business logic — register, login, token management
// DEPENDS ON: prisma, bcrypt, jsonwebtoken, env, ApiError
// LAST UPDATED: F05 - Auth System

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../config/database";
import { env } from "../../config/env";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import type {
  RegisterInput,
  LoginInput,
} from "./auth.validation";
import { cacheSet, cacheGet, cacheDel } from "../../config/redis";
import { addEmailJob } from "../../config/queue";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currencyPref: string;
  timezone: string;
  createdAt: Date;
}

interface JwtAccessPayload {
  id: string;
  email: string;
  name: string;
}

interface JwtRefreshPayload {
  id: string;
  tokenId: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ─────────────────────────────────────────────
// Token Generators
// ─────────────────────────────────────────────

function generateAccessToken(user: AuthUser): string {
  const payload: JwtAccessPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
    issuer: "splitsync",
    audience: "splitsync-client",
  } as jwt.SignOptions);
}

function generateRefreshToken(
  userId: string,
  tokenId: string
): string {
  const payload: JwtRefreshPayload = {
    id: userId,
    tokenId,
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
    issuer: "splitsync",
    audience: "splitsync-client",
  } as jwt.SignOptions);
}

// ─────────────────────────────────────────────
// Store refresh token in DB (hashed)
// ─────────────────────────────────────────────

async function storeRefreshToken(
  userId: string,
  tokenId: string,
  rawToken: string
): Promise<void> {
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS
  );

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId,
      tokenHash,
      expiresAt,
    },
  });
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

export async function registerUser(
  input: RegisterInput
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const { name, email, password, currencyPref, timezone } = input;

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new ApiError(
      409,
      ErrorCode.EMAIL_ALREADY_EXISTS,
      "An account with this email already exists"
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      currencyPref: currencyPref ?? "INR",
      timezone: timezone ?? "Asia/Kolkata",
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      currencyPref: true,
      timezone: true,
      createdAt: true,
    },
  });

  // Send welcome email (non-blocking)
  void addEmailJob({
    to: user.email,
    subject: "Welcome to SplitSync!",
    templateName: "welcome",
    templateData: {
      name: user.name,
    },
  });

  // Generate tokens
  const tokenId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id, tokenId);

  // Store refresh token
  await storeRefreshToken(user.id, tokenId, refreshToken);

  return {
    user,
    tokens: { accessToken, refreshToken },
  };
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

export async function loginUser(
  input: LoginInput
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      currencyPref: true,
      timezone: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) {
    // Use generic message to prevent user enumeration
    throw ApiError.unauthorized(
      "Invalid email or password",
      ErrorCode.INVALID_CREDENTIALS
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw ApiError.unauthorized(
      "Invalid email or password",
      ErrorCode.INVALID_CREDENTIALS
    );
  }

  // Strip passwordHash from response
  const { passwordHash: _, ...safeUser } = user;

  // Generate tokens
  const tokenId = crypto.randomUUID();
  const accessToken = generateAccessToken(safeUser);
  const refreshToken = generateRefreshToken(safeUser.id, tokenId);

  // Store refresh token
  await storeRefreshToken(safeUser.id, tokenId, refreshToken);

  return {
    user: safeUser,
    tokens: { accessToken, refreshToken },
  };
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────

export async function refreshAccessToken(
  rawRefreshToken: string
): Promise<{ user: AuthUser; tokens: TokenPair }> {
  // 1. Verify JWT signature
  let payload: JwtRefreshPayload;

  try {
    payload = jwt.verify(
      rawRefreshToken,
      env.JWT_REFRESH_SECRET,
      {
        issuer: "splitsync",
        audience: "splitsync-client",
      }
    ) as JwtRefreshPayload;
  } catch {
    throw ApiError.unauthorized(
      "Invalid or expired refresh token",
      ErrorCode.TOKEN_EXPIRED
    );
  }

  // 2. Find token record in DB
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          currencyPref: true,
          timezone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    throw ApiError.unauthorized(
      "Refresh token not found or already used",
      ErrorCode.INVALID_TOKEN
    );
  }

  // 3. Check expiry
  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: payload.tokenId },
    });
    throw ApiError.unauthorized(
      "Refresh token expired. Please log in again.",
      ErrorCode.TOKEN_EXPIRED
    );
  }

  // 4. Verify token hash matches
  const isHashValid = await bcrypt.compare(
    rawRefreshToken,
    tokenRecord.tokenHash
  );

  if (!isHashValid) {
    // Possible token theft — invalidate ALL tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: tokenRecord.userId },
    });
    throw ApiError.unauthorized(
      "Token validation failed. All sessions invalidated.",
      ErrorCode.INVALID_TOKEN
    );
  }

  // 5. Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({
    where: { id: payload.tokenId },
  });

  const newTokenId = crypto.randomUUID();
  const newAccessToken = generateAccessToken(tokenRecord.user);
  const newRefreshToken = generateRefreshToken(
    tokenRecord.user.id,
    newTokenId
  );

  await storeRefreshToken(
    tokenRecord.user.id,
    newTokenId,
    newRefreshToken
  );

  return {
    user: tokenRecord.user,
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  };
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

export async function logoutUser(
  rawRefreshToken: string
): Promise<void> {
  try {
    const payload = jwt.verify(
      rawRefreshToken,
      env.JWT_REFRESH_SECRET,
      {
        issuer: "splitsync",
        audience: "splitsync-client",
      }
    ) as JwtRefreshPayload;

    // Delete this specific refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        id: payload.tokenId,
      },
    });
  } catch {
    // If token is invalid/expired, just continue
    // Logout should always succeed from user perspective
  }
}

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// Full implementation in F30 (Email Notifications)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  // Always return success to prevent user enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    // Silently return — do not reveal if email exists
    return;
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(resetToken, 10);

  // Cache hashed token for 1 hour: key = reset:{userId}
  await cacheSet(`reset:${user.id}`, hashedToken, 3600);

  // Queue email with raw token (user uses this in the link)
  await addEmailJob({
    to: user.email,
    subject: "Reset your SplitSync password",
    templateName: "password-reset",
    templateData: {
      name: user.name,
      resetToken: `${user.id}:${resetToken}`,
    },
  });
}

// ─────────────────────────────────────────────
// RESET PASSWORD
// Full implementation in F30
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  // Token format: userId:rawToken
  const parts = token.split(":");
  if (parts.length !== 2) {
    throw ApiError.badRequest(
      "Invalid reset token",
      ErrorCode.INVALID_TOKEN
    );
  }

  const [userId, rawToken] = parts;

  // Get cached hashed token
  const cachedHash = await cacheGet<string>(`reset:${userId}`);

  if (!cachedHash) {
    throw ApiError.badRequest(
      "Reset token has expired. Please request a new one.",
      ErrorCode.TOKEN_EXPIRED
    );
  }

  // Verify token
  const isValid = await bcrypt.compare(rawToken, cachedHash);

  if (!isValid) {
    throw ApiError.badRequest(
      "Invalid reset token",
      ErrorCode.INVALID_TOKEN
    );
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all refresh tokens (security)
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  // Delete reset token from cache
  await cacheDel(`reset:${userId}`);
}