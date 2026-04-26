// FILE: apps/server/src/shared/middlewares/notFound.middleware.ts
// PURPOSE: Catches all unmatched routes and returns 404
// DEPENDS ON: express, ApiResponse
// LAST UPDATED: F04 - Express Server Base

import { Request, Response } from "express";
import { sendError } from "../utils/ApiResponse";
import { ErrorCode } from "../utils/ApiError";

export function notFoundMiddleware(req: Request, res: Response): void {
  sendError(
    res,
    404,
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} not found`
  );
}