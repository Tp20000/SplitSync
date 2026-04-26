// FILE: apps/server/src/modules/notifications/notification.controller.ts
// PURPOSE: Express handlers for notification endpoints
// DEPENDS ON: notification.service, ApiResponse
// LAST UPDATED: F29 - Notification System

import { Request, Response, NextFunction } from "express";
import * as NotificationService from "./notification.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";

// GET /api/v1/notifications
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const page = req.query.page
      ? parseInt(req.query.page as string, 10)
      : 1;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;

    const result = await NotificationService.getNotifications(
      req.user.id,
      page,
      limit
    );

    sendSuccess(res, result.notifications, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/:id/read
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const notification = await NotificationService.markAsRead(
      req.user.id,
      req.params.id
    );

    sendSuccess(res, { notification });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/notifications/read-all
export async function markAllAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await NotificationService.markAllAsRead(
      req.user.id
    );

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}