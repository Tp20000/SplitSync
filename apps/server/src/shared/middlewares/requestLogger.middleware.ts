// FILE: apps/server/src/shared/middlewares/requestLogger.middleware.ts
// PURPOSE: HTTP request logging using Morgan + Winston
// DEPENDS ON: morgan, logger
// LAST UPDATED: F47 Fix - Morgan compile overload

import { RequestHandler } from "express";
import { isDev } from "../../config/env";
import { morganStream } from "../utils/logger";

// ─────────────────────────────────────────────
// Lazy-load morgan to avoid type issues
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const morgan = require("morgan") as (
  format: string,
  options?: {
    stream?: { write: (str: string) => void };
    skip?: (req: { url: string }) => boolean;
  }
) => RequestHandler;

const skip = (req: { url: string }): boolean =>
  req.url === "/health" || req.url === "/api/v1/health";

const format = isDev
  ? ":method :url :status :res[content-length] - :response-time ms"
  : ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]';

export const requestLogger: RequestHandler = morgan(format, {
  stream: morganStream,
  skip,
});