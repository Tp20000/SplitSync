// FILE: apps/server/src/config/database.ts
// PURPOSE: Prisma client singleton — prevents multiple instances in dev hot-reload
// DEPENDS ON: @prisma/client, prisma/schema.prisma
// LAST UPDATED: F02 - Database Setup

import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────
// Global declaration to prevent multiple instances
// during Next.js/ts-node-dev hot reloads
// ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;