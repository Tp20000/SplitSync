// FILE: apps/server/src/modules/notifications/notification.routes.ts
// PURPOSE: Notification route definitions
// DEPENDS ON: express, notification.controller, auth.middleware
// LAST UPDATED: F29 - Notification System

import { Router } from "express";
import * as NotificationController from "./notification.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.use(authenticate);

// GET /api/v1/notifications
router.get("/", NotificationController.getNotifications);

// PATCH /api/v1/notifications/read-all (must be before /:id)
router.patch(
  "/read-all",
  NotificationController.markAllAsRead
);

// PATCH /api/v1/notifications/:id/read
router.patch(
  "/:id/read",
  NotificationController.markAsRead
);

export default router;