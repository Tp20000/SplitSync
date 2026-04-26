// FILE: apps/server/src/modules/expenses/recurring.controller.ts
// PURPOSE: Express handlers for recurring expense endpoints
// DEPENDS ON: recurring.service, ApiResponse
// LAST UPDATED: F31 - Recurring Expenses Engine

import { Request, Response, NextFunction } from "express";
import * as RecurringService from "./recurring.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";
import type {
  CreateRecurringInput,
  UpdateRecurringInput,
} from "./recurring.validation";

// POST /api/v1/groups/:id/recurring
export async function createRule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    // Debug: log what we received
    console.log("[RecurringController] createRule called");
    console.log("[RecurringController] body:", req.body);
    console.log("[RecurringController] params:", req.params);

    const rule = await RecurringService.createRecurringRule(
      req.params.id,
      req.user.id,
      req.body as CreateRecurringInput
    );
    sendSuccess(res, { rule }, 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/recurring
export async function listRules(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const rules = await RecurringService.listRecurringRules(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, { rules });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/groups/:id/recurring/:rid
export async function updateRule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const rule = await RecurringService.updateRecurringRule(
      req.params.id,
      req.params.rid,
      req.user.id,
      req.body as UpdateRecurringInput
    );
    sendSuccess(res, { rule });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/groups/:id/recurring/:rid
export async function deleteRule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    await RecurringService.deleteRecurringRule(
      req.params.id,
      req.params.rid,
      req.user.id
    );
    sendSuccess(res, { message: "Recurring rule deleted" });
  } catch (err) {
    next(err);
  }
}