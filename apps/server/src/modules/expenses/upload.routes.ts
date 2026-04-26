// FILE: apps/server/src/modules/expenses/upload.routes.ts
// PURPOSE: Receipt upload/delete routes
// DEPENDS ON: express, multer, upload.controller, auth
// LAST UPDATED: F34 - Receipt Image Upload

import { Router } from "express";
import {
  uploadExpenseReceipt,
  deleteExpenseReceipt,
  multerUpload,
} from "./upload.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router({ mergeParams: true });

router.use(authenticate);

// POST /api/v1/groups/:id/expenses/:eid/receipt
router.post(
  "/",
  multerUpload.single("receipt"),
  uploadExpenseReceipt
);

// DELETE /api/v1/groups/:id/expenses/:eid/receipt
router.delete("/", deleteExpenseReceipt);

export default router;