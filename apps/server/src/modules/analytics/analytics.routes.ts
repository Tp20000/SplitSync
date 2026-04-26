// FILE: apps/server/src/modules/analytics/analytics.routes.ts
// PURPOSE: Analytics + PDF export routes
// DEPENDS ON: express, analytics.controller, auth
// LAST UPDATED: F36 - PDF Export

import { Router } from "express";
import * as AnalyticsController from "./analytics.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get("/summary", AnalyticsController.getSummary);
router.get("/trends", AnalyticsController.getTrends);
router.get("/categories", AnalyticsController.getCategories);
router.get("/members", AnalyticsController.getMemberSpending);

// PDF export
router.get(
  "/export/pdf",
  AnalyticsController.exportPdf
);

export default router;