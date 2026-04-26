// FILE: apps/web/src/lib/logger.ts
// PURPOSE: Simple frontend logger (console in dev, no-op in prod)
// DEPENDS ON: none
// LAST UPDATED: F20 - Socket.io Client Setup

const isDev = process.env.NODE_ENV === "development";

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.info("[SplitSync]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[SplitSync]", ...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors
    console.error("[SplitSync]", ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[SplitSync]", ...args);
  },
};