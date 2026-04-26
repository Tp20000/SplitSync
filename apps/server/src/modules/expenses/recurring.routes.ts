// FILE: apps/server/src/modules/expenses/recurring.routes.ts
// PURPOSE: Recurring expense rule routes
// DEPENDS ON: express, recurring.controller, auth, validate
// LAST UPDATED: F31 Fix - Body parsing

import { Router } from "express";
import express from "express";
import * as RecurringController from "./recurring.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringIdParamSchema,
} from "./recurring.validation";

const router = Router({ mergeParams: true });

// Ensure body is parsed for this router
router.use(express.json());

router.use(authenticate);

// POST /api/v1/groups/:id/recurring
router.post(
  "/",
  validate(createRecurringSchema),
  RecurringController.createRule
);

// GET /api/v1/groups/:id/recurring
router.get(
  "/",
  RecurringController.listRules
);

// PATCH /api/v1/groups/:id/recurring/:rid
router.patch(
  "/:rid",
  validate(updateRecurringSchema),
  RecurringController.updateRule
);

// DELETE /api/v1/groups/:id/recurring/:rid
router.delete(
  "/:rid",
  validate(recurringIdParamSchema),
  RecurringController.deleteRule
);

export default router;