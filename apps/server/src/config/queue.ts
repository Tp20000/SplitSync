// FILE: apps/server/src/config/queue.ts
// PURPOSE: Defines all BullMQ queues used across SplitSync
// DEPENDS ON: bullmq, src/config/redis.ts
// LAST UPDATED: F03 - Redis + BullMQ Setup

import { Queue, QueueEvents, Worker } from "bullmq";
import { redisConnectionOptions } from "./redis";

// ─────────────────────────────────────────────
// Queue Names — single source of truth
// ─────────────────────────────────────────────

export const QUEUE_NAMES = {
  EMAIL: "email",
  NOTIFICATION: "notification",
  RECURRING_EXPENSE: "recurring-expense",
  PAYMENT_REMINDER: "payment-reminder",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ─────────────────────────────────────────────
// Job Data Types
// ─────────────────────────────────────────────

export interface EmailJobData {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

export interface RecurringExpenseJobData {
  recurringRuleId: string;
  groupId: string;
}

export interface PaymentReminderJobData {
  groupId: string;
  debtorUserId: string;
  creditorUserId: string;
  amount: number;
  currency: string;
}

// ─────────────────────────────────────────────
// Queue Instances
// ─────────────────────────────────────────────

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 2, // Reduce from 3 to 2
    backoff: {
      type: "exponential",
      delay: 5000, // Start at 5 seconds
    },
    removeOnComplete: {
      count: 100,
      age: 3600,
    },
    removeOnFail: {
      count: 50, // Keep fewer failed jobs
    },
  },
});

export const notificationQueue = new Queue<NotificationJobData>(
  QUEUE_NAMES.NOTIFICATION,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  }
);

export const recurringExpenseQueue = new Queue<RecurringExpenseJobData>(
  QUEUE_NAMES.RECURRING_EXPENSE,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 5000,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
    },
  }
);

export const paymentReminderQueue = new Queue<PaymentReminderJobData>(
  QUEUE_NAMES.PAYMENT_REMINDER,
  {
    connection: redisConnectionOptions,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 3000,
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  }
);

// ─────────────────────────────────────────────
// Queue Events (for monitoring/logging)
// ─────────────────────────────────────────────

export const emailQueueEvents = new QueueEvents(QUEUE_NAMES.EMAIL, {
  connection: redisConnectionOptions,
});

export const notificationQueueEvents = new QueueEvents(
  QUEUE_NAMES.NOTIFICATION,
  {
    connection: redisConnectionOptions,
  }
);

// ─────────────────────────────────────────────
// Queue helper: Add email job
// ─────────────────────────────────────────────

export async function addEmailJob(data: EmailJobData): Promise<void> {
  await emailQueue.add("send-email", data);
}

// ─────────────────────────────────────────────
// Queue helper: Add notification job
// ─────────────────────────────────────────────

export async function addNotificationJob(
  data: NotificationJobData
): Promise<void> {
  await notificationQueue.add("create-notification", data);
}

// ─────────────────────────────────────────────
// Queue helper: Add recurring expense job
// ─────────────────────────────────────────────

export async function addRecurringExpenseJob(
  data: RecurringExpenseJobData
): Promise<void> {
  await recurringExpenseQueue.add("process-recurring", data);
}

// ─────────────────────────────────────────────
// Queue helper: Add payment reminder job
// ─────────────────────────────────────────────

export async function addPaymentReminderJob(
  data: PaymentReminderJobData
): Promise<void> {
  await paymentReminderQueue.add("send-reminder", data);
}

// ─────────────────────────────────────────────
// Graceful shutdown — close all queues
// ─────────────────────────────────────────────

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    emailQueue.close(),
    notificationQueue.close(),
    recurringExpenseQueue.close(),
    paymentReminderQueue.close(),
  ]);
  console.log("[BullMQ] All queues closed");
}

// ─────────────────────────────────────────────
// Export worker type for processors
// ─────────────────────────────────────────────

export { Worker };