// FILE: apps/server/src/modules/expenses/expense.routes.ts
// PURPOSE: Expense route definitions with auth + validation
// DEPENDS ON: express, expense.controller, auth.middleware, validate.middleware
// LAST UPDATED: F13 - Expense CRUD API

import { Router } from "express";
import * as ExpenseController from "./expense.controller";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
} from "./expense.validation";

import * as CommentController from "./comment.controller";
import {
  createCommentSchema,
  listCommentsSchema,
} from "./comment.validation";

const router = Router({ mergeParams: true });

// ─────────────────────────────────────────────
// All routes require authentication
// ─────────────────────────────────────────────

router.use(authenticate);

// POST /api/v1/groups/:id/expenses
router.post(
  "/",
  validate(createExpenseSchema),
  ExpenseController.createExpense
);

// GET /api/v1/groups/:id/expenses
router.get(
  "/",
  validate(listExpensesQuerySchema),
  ExpenseController.listExpenses
);

// GET /api/v1/groups/:id/expenses/:eid
router.get(
  "/:eid",
  validate(expenseIdParamSchema),
  ExpenseController.getExpense
);

// PATCH /api/v1/groups/:id/expenses/:eid
router.patch(
  "/:eid",
  validate(updateExpenseSchema),
  ExpenseController.updateExpense
);

// DELETE /api/v1/groups/:id/expenses/:eid
router.delete(
  "/:eid",
  validate(expenseIdParamSchema),
  ExpenseController.deleteExpense
);

// GET /api/v1/groups/:id/expenses/:eid/history
router.get(
  "/:eid/history",
  validate(expenseIdParamSchema),
  ExpenseController.getExpenseHistory
);

// ─────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────

// POST /api/v1/groups/:id/expenses/:eid/comments
router.post(
  "/:eid/comments",
  validate(createCommentSchema),
  CommentController.createComment
);

// GET /api/v1/groups/:id/expenses/:eid/comments
router.get(
  "/:eid/comments",
  validate(listCommentsSchema),
  CommentController.listComments
);

export default router;