// FILE: apps/server/src/shared/middlewares/validate.middleware.ts
// PURPOSE: Generic Zod validation middleware for routes
// DEPENDS ON: zod, express
// LAST UPDATED: F44 Fix - Remove debug logs

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/ApiResponse";
import { ErrorCode } from "../utils/ApiError";

export function validate(schema: ZodSchema) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed && typeof parsed === "object") {
        const p = parsed as {
          body?: unknown;
          query?: unknown;
          params?: unknown;
        };
        if (p.body !== undefined) req.body = p.body;
        if (p.query !== undefined)
          req.query = p.query as Record<string, string>;
        if (p.params !== undefined)
          req.params = p.params as Record<string, string>;
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        sendError(
          res,
          422,
          ErrorCode.VALIDATION_ERROR,
          "Validation failed",
          err.flatten().fieldErrors
        );
        return;
      }
      next(err);
    }
  };
}