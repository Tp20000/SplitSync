// FILE: apps/server/tests/helpers/testServer.ts
// PURPOSE: Creates Express app instance for integration testing
// DEPENDS ON: express app, supertest
// LAST UPDATED: F44 - Integration Tests

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import authRouter from "../../src/modules/auth/auth.routes";
import userRouter from "../../src/modules/users/user.routes";
import groupRouter from "../../src/modules/groups/group.routes";
import expenseRouter from "../../src/modules/expenses/expense.routes";
import { errorMiddleware } from "../../src/shared/middlewares/error.middleware";
import { notFoundMiddleware } from "../../src/shared/middlewares/notFound.middleware";

// ─────────────────────────────────────────────
// Create test app (minimal setup, no socket/cron)
// ─────────────────────────────────────────────

export function createTestApp(): Application {
  const app = express();

  // Basic middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ credentials: true }));
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(cookieParser());

  // Routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/groups", groupRouter);
  app.use("/api/v1/groups/:id/expenses", expenseRouter);

  // Error handling
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}