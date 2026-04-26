// FILE: apps/server/src/modules/analytics/analytics.controller.ts
// PURPOSE: Express handlers for analytics endpoints
// DEPENDS ON: analytics.service, ApiResponse
// LAST UPDATED: F35 - Analytics Dashboard

import { Request, Response, NextFunction } from "express";
import * as AnalyticsService from "./analytics.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";

// GET /api/v1/groups/:id/analytics/summary
export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const summary = await AnalyticsService.getGroupSummary(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/analytics/trends
export async function getTrends(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const period =
      (req.query.period as "daily" | "weekly" | "monthly") ??
      "monthly";
    const months = req.query.months
      ? parseInt(req.query.months as string, 10)
      : 6;

    const trends = await AnalyticsService.getSpendingTrends(
      req.params.id,
      req.user.id,
      period,
      months
    );
    sendSuccess(res, { trends, period });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/analytics/categories
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const data = await AnalyticsService.getCategoryBreakdown(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/analytics/members
export async function getMemberSpending(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();
    const data = await AnalyticsService.getMemberSpending(
      req.params.id,
      req.user.id
    );
    sendSuccess(res, { members: data });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/groups/:id/analytics/export/pdf
export async function exportPdf(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const { generateGroupPdf } = await import("./pdf.service");
    await generateGroupPdf(req.params.id, req.user.id, res);
  } catch (err) {
    // Only call next if headers not sent yet
    if (!res.headersSent) {
      next(err);
    }
  }
}