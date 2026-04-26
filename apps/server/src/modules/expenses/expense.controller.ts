// FILE: apps/server/src/modules/expenses/expense.controller.ts
// PURPOSE: Express handlers for expense endpoints
// DEPENDS ON: expense.service, ApiResponse, ApiError
// LAST UPDATED: F13 - Expense CRUD API

import { Request, Response, NextFunction } from "express";
import * as ExpenseService from "./expense.service";
import { sendSuccess } from "../../shared/utils/ApiResponse";
import { ApiError } from "../../shared/utils/ApiError";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
} from "./expense.validation";

// ─────────────────────────────────────────────
// POST /api/v1/groups/:id/expenses
// ─────────────────────────────────────────────

export async function createExpense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const expense = await ExpenseService.createExpense(
      req.params.id,
      req.user.id,
      req.body as CreateExpenseInput
    );

    sendSuccess(res, { expense }, 201);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/expenses
// ─────────────────────────────────────────────

export async function listExpenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const result = await ExpenseService.listExpenses(
      req.params.id,
      req.user.id,
      req.query as unknown as ListExpensesQuery
    );

    sendSuccess(res, result.expenses, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/expenses/:eid
// ─────────────────────────────────────────────

export async function getExpense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const expense = await ExpenseService.getExpenseById(
      req.params.id,
      req.params.eid,
      req.user.id
    );

    sendSuccess(res, { expense });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/v1/groups/:id/expenses/:eid
// ─────────────────────────────────────────────

export async function updateExpense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const expense = await ExpenseService.updateExpense(
      req.params.id,
      req.params.eid,
      req.user.id,
      req.body as UpdateExpenseInput
    );

    sendSuccess(res, { expense });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/v1/groups/:id/expenses/:eid
// ─────────────────────────────────────────────

export async function deleteExpense(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    await ExpenseService.deleteExpense(
      req.params.id,
      req.params.eid,
      req.user.id
    );

    sendSuccess(res, { message: "Expense deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/v1/groups/:id/expenses/:eid/history
// ─────────────────────────────────────────────

export async function getExpenseHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw ApiError.unauthorized();

    const history = await ExpenseService.getExpenseHistory(
      req.params.id,
      req.params.eid,
      req.user.id
    );

    sendSuccess(res, { history });
  } catch (err) {
    next(err);
  }
}