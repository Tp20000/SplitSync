// FILE: apps/server/src/modules/settlements/settlement.routes.ts
// PURPOSE: Settlement route definitions
// DEPENDS ON: express, settlement.controller, auth, validate
// LAST UPDATED: F25 - Settlement Recording API

import { Router } from "express";
import * as SettlementController from "./settlement.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  createSettlementSchema,
  listSettlementsSchema,
} from "./settlement.validation";

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /api/v1/groups/:id/settlements
router.post(
  "/",
  validate(createSettlementSchema),
  SettlementController.createSettlement
);

// GET /api/v1/groups/:id/settlements
router.get(
  "/",
  validate(listSettlementsSchema),
  SettlementController.listSettlements
);

export default router;