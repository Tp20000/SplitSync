// FILE: apps/server/src/app.ts
// PURPOSE: Main Express application — wires all middleware, routes, and servers
// DEPENDS ON: express, socket.io, all config files, all middleware
// LAST UPDATED: F04 - Express Server Base

import "dotenv/config";
import express, { Application, Request, Response } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { logger } from "./shared/utils/logger";
import { requestLogger } from "./shared/middlewares/requestLogger.middleware";
import { errorMiddleware } from "./shared/middlewares/error.middleware";
import { notFoundMiddleware } from "./shared/middlewares/notFound.middleware";
import prisma from "./config/database";
import { redisClient, disconnectRedis } from "./config/redis";
import { closeAllQueues } from "./config/queue";
import { startAllWorkers, stopAllWorkers } from "./jobs/processors";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/users/user.routes";
import groupRouter from "./modules/groups/group.routes";
import expenseRouter from "./modules/expenses/expense.routes";
import { initializeSocket, shutdownSocket } from "./socket";
import { Server as SocketIOServer } from "socket.io";
import settlementRouter from "./modules/settlements/settlement.routes";
import notificationRouter from "./modules/notifications/notification.routes";
import recurringRouter from "./modules/expenses/recurring.routes";
import { startCronJobs, stopCronJobs } from "./jobs/cron";
import uploadRouter from "./modules/expenses/upload.routes";
import analyticsRouter from "./modules/analytics/analytics.routes";
import {
  globalLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  strictAuthLimiter,
} from "./shared/middlewares/rateLimiter.middleware";
import { securityHeaders } from "./shared/middlewares/security.middleware";


// ─────────────────────────────────────────────
// App + HTTP Server
// ─────────────────────────────────────────────

const app: Application = express();
const httpServer = http.createServer(app);
let io: SocketIOServer;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ─────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────

app.use(
  helmet({
    // Allow cross-origin resources (images, fonts)
    crossOriginResourcePolicy: { policy: "cross-origin" },

    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
        ],
        connectSrc: [
          "'self'",
          env.FRONTEND_URL,
          "wss:",
          "ws:",
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },

    // Strict transport security
    hsts: {
      maxAge: 31536000,        // 1 year
      includeSubDomains: true,
      preload: true,
    },

    // Prevent MIME sniffing
    noSniff: true,

    // Don't expose powered-by header
    hidePoweredBy: true,

    // XSS protection
    xssFilter: true,

    // Referrer policy
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);

// Additional security headers
app.use(securityHeaders);

app.use(
  cors({
    origin: [
      env.FRONTEND_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);
app.use("/api/v1/groups/:id/recurring", recurringRouter);

// ─────────────────────────────────────────────
// Body Parsing + Compression
// ─────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());
app.use(cookieParser());

// ─────────────────────────────────────────────
// Request Logging
// ─────────────────────────────────────────────

app.use(requestLogger);

app.use(globalLimiter);

// ─────────────────────────────────────────────
// Health Check Route
// ─────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: "1.0.0",
    },
  });
});


// Dev-only: manual CRON triggers
if (env.NODE_ENV === "development") {
  app.post("/api/v1/dev/trigger-reminders", async (_req, res) => {
    const { triggerPaymentReminders } = await import("./jobs/cron");
    await triggerPaymentReminders();
    res.json({ success: true, data: { message: "Reminders triggered" } });
  });

  app.post("/api/v1/dev/trigger-recurring", async (_req, res) => {
    const { triggerRecurringCheck } = await import("./jobs/cron");
    await triggerRecurringCheck();
    res.json({ success: true, data: { message: "Recurring check triggered" } });
  });
}

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", apiLimiter, userRouter);

// Group sub-routes BEFORE the main group route
// This prevents /:id from catching "recurring", "expenses" etc.
app.use("/api/v1/groups/:id/expenses", apiLimiter, expenseRouter);
app.use("/api/v1/groups/:id/settlements", apiLimiter, settlementRouter);
app.use("/api/v1/groups/:id/recurring", apiLimiter, recurringRouter);

// Main group routes LAST
app.use("/api/v1/groups", groupRouter);

app.use("/api/v1/notifications", apiLimiter, notificationRouter);

app.use(
  "/api/v1/groups/:id/expenses/:eid/receipt",
  uploadLimiter,
  uploadRouter
);

app.use("/api/v1/groups/:id/analytics", apiLimiter, analyticsRouter);

app.use("/api/v1/auth", authLimiter, authRouter);

// ─────────────────────────────────────────────
// 404 + Error Handling (must be last)
// ─────────────────────────────────────────────

app.use(notFoundMiddleware);
app.use(errorMiddleware);

// ─────────────────────────────────────────────
// Server Bootstrap
// ─────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    // 1. Verify database connection
    await prisma.$connect();
    logger.info("[Database] Connected to PostgreSQL");

    // 2. Verify Redis connection (non-fatal in production)
    try {
      await redisClient.ping();
      logger.info("[Redis] Connected to Redis");
    } catch (redisErr) {
      const error = redisErr as Error;
      if (IS_PRODUCTION) {
        logger.warn(
          "[Redis] Could not connect to Redis — continuing without cache:",
          { message: error.message }
        );
      } else {
        throw redisErr; // Fatal in development
      }
    }

    // 3. Start BullMQ workers
    startAllWorkers();
    logger.info("[Workers] BullMQ workers started");

    // 4. Initialize Socket.io
    io = initializeSocket(httpServer);
    logger.info("[Socket] Socket.io initialized");

    // 5. Start CRON jobs
    startCronJobs();
    logger.info("[CRON] Scheduled jobs started");

    // 6. Start HTTP server
    httpServer.listen(env.PORT, () => {
      logger.info(
        `[Server] SplitSync API running on port ${env.PORT} (${env.NODE_ENV})`
      );
      logger.info(
        `[Server] Health: http://localhost:${env.PORT}/health`
      );
    });
  } catch (err) {
    const error = err as Error;
    logger.error("[Server] Bootstrap failed:", {
      message: error.message,
    });
    process.exit(1);
  }
}

// ─────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`[Server] ${signal} received — shutting down gracefully`);

  try {
    // 1. Stop accepting new connections
    httpServer.close(() => {
      logger.info("[Server] HTTP server closed");
    });

    // 2. Shutdown Socket.io
    if (io) {
      await shutdownSocket(io);
    }

    // 3. Stop CRON jobs
    stopCronJobs();

    // 2. Stop workers
    await stopAllWorkers();

    // 3. Close queues
    await closeAllQueues();

    // 4. Disconnect Redis
    await disconnectRedis();

    // 5. Disconnect Prisma
    await prisma.$disconnect();
    logger.info("[Database] Prisma disconnected");

    logger.info("[Server] Graceful shutdown complete");
    process.exit(0);
  } catch (err) {
    const error = err as Error;
    logger.error("[Server] Error during shutdown:", {
      message: error.message,
    });
    process.exit(1);
  }
}

// ─────────────────────────────────────────────
// Process Signal Handlers
// ─────────────────────────────────────────────

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  logger.error("[Server] Unhandled Rejection:", { reason });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  logger.error("[Server] Uncaught Exception:", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// ─────────────────────────────────────────────
// Export for testing
// ─────────────────────────────────────────────

export { app, httpServer };

// Start the server
void bootstrap();