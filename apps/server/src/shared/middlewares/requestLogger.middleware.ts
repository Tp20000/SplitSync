// FILE: apps/server/src/shared/middlewares/requestLogger.middleware.ts
// PURPOSE: HTTP request logging using Morgan + Winston
// DEPENDS ON: morgan, logger
// LAST UPDATED: F47 Fix - Morgan type overload

import morgan from "morgan";
import { isDev } from "../../config/env";
import { morganStream } from "../utils/logger";

// Skip health check routes
const skip = (req: { url: string }): boolean =>
  req.url === "/health" || req.url === "/api/v1/health";

// Use morgan with explicit token string format
export const requestLogger = isDev
  ? morgan(
      ":method :url :status :res[content-length] - :response-time ms",
      {
        stream: morganStream,
        skip,
      }
    )
  : morgan("combined", {
      stream: morganStream,
      skip,
    });