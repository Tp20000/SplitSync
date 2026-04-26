// FILE: apps/server/src/modules/settlements/settlement.controller.ts
// PURPOSE: Express handlers for settlement endpoints
// DEPENDS ON: settlement.service, ApiResponse
// LAST UPDATED: F25 - Settlement Recording API

import { Request, Response, NextFunction } from "express";
import * as SettlementService from "./settlement.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";
import type {
  CreateSettlementInput,
  ListSettlementsQuery,
} from "./settlement.validation";

// POST /api/v1/groups/:id/settlements
export async function createSettlement(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const settlement = await SettlementService.createSettlement(
      req.params.id,
      req.user.id,
      req.body as CreateSettlementInput
    );

    sendSuccess(res, { settlement }, 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/settlements
export async function listSettlements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await SettlementService.listSettlements(
      req.params.id,
      req.user.id,
      req.query as unknown as ListSettlementsQuery
    );

    sendSuccess(res, result.settlements, 200, result.meta);
  } catch (err) {
    next(err);
  }
}