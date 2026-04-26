// FILE: apps/server/src/shared/middlewares/requestLogger.middleware.ts
// PURPOSE: HTTP request logging using Morgan + Winston
// DEPENDS ON: morgan, src/shared/utils/logger.ts
// LAST UPDATED: F04 - Express Server Base

import morgan, { StreamOptions } from "morgan";
import { isDev } from "../../config/env";
import { morganStream } from "../utils/logger";

// ─────────────────────────────────────────────
// Morgan format — detailed in dev, combined in prod
// ─────────────────────────────────────────────

const stream: StreamOptions = morganStream;

const morganFormat = isDev
  ? ":method :url :status :res[content-length] - :response-time ms"
  : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]';

// Skip health check routes to reduce noise
function skip(req: { url: string }): boolean {
  return req.url === "/health" || req.url === "/api/v1/health";
}

export const requestLogger = morgan(morganFormat, {
  stream,
  skip,
});