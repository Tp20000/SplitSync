// FILE: apps/server/src/jobs/processors/notification.processor.ts
// PURPOSE: Processes notification jobs — saves to DB + emits socket event
// LAST UPDATED: F47 Fix - Prisma JSON type

import { Job } from "bullmq";
import { Prisma } from "@prisma/client";
import {
  NotificationJobData,
  QUEUE_NAMES,
  Worker,
} from "../../config/queue";
import { redisConnectionOptions } from "../../config/redis";
import prisma from "../../config/database";
import { emitNotification } from "../../socket/emitters";
import { logger } from "../../shared/utils/logger";

async function processNotificationJob(
  job: Job<NotificationJobData>
): Promise<void> {
  const { userId, type, title, body, metadata } = job.data;

  logger.info(
    `[NotificationProcessor] Processing job ${job.id} for user ${userId}`
  );

  try {
    // 1. Save to DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
        isRead: false,
      },
    });

    logger.info(
      `[NotificationProcessor] Saved notification ${notification.id}`
    );

    // 2. Emit socket event
    emitNotification(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? undefined,
      metadata:
        (notification.metadata as Record<string, unknown>) ??
        undefined,
    });

    logger.info(
      `[NotificationProcessor] Socket emitted for user ${userId}`
    );
  } catch (err) {
    const error = err as Error;
    logger.error(
      `[NotificationProcessor] Failed for job ${job.id}:`,
      { message: error.message }
    );
    throw error;
  }
}

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATION,
    processNotificationJob,
    {
      connection: redisConnectionOptions,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`[NotificationWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `[NotificationWorker] Job ${job?.id} failed:`,
      err.message
    );
  });

  worker.on("error", (err) => {
    logger.error("[NotificationWorker] Worker error:", err.message);
  });

  return worker;
}