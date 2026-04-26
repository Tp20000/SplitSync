// FILE: apps/server/src/jobs/processors/reminder.processor.ts
// PURPOSE: Processes payment reminder jobs — sends notification + email
// DEPENDS ON: bullmq, prisma, queue, emitters, emailTemplates
// LAST UPDATED: F32 - Payment Reminder Jobs

import { Job } from "bullmq";
import {
  PaymentReminderJobData,
  QUEUE_NAMES,
  Worker,
  addNotificationJob,
  addEmailJob,
} from "../../config/queue";
import { redisConnectionOptions } from "../../config/redis";
import prisma from "../../config/database";
import { logger } from "../../shared/utils/logger";

// ─────────────────────────────────────────────
// Process payment reminder
// ─────────────────────────────────────────────

async function processPaymentReminderJob(
  job: Job<PaymentReminderJobData>
): Promise<void> {
  const {
    groupId,
    debtorUserId,
    creditorUserId,
    amount,
    currency,
  } = job.data;

  logger.info(
    `[ReminderProcessor] Job ${job.id}: ${debtorUserId} owes ${creditorUserId} ${currency} ${amount}`
  );

  try {
    // Fetch user details
    const [debtor, creditor, group] = await Promise.all([
      prisma.user.findUnique({
        where: { id: debtorUserId },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: creditorUserId },
        select: { id: true, name: true, email: true },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true },
      }),
    ]);

    if (!debtor || !creditor || !group) {
      logger.warn(
        `[ReminderProcessor] Missing user/group for job ${job.id} — skipping`
      );
      return;
    }

    const formattedAmount = formatAmount(amount, currency);

    // 1. In-app notification
    void addNotificationJob({
      userId: debtorUserId,
      type: "payment_reminder",
      title: "Payment reminder",
      body: `You owe ${creditor.name} ${formattedAmount} in ${group.name}`,
      metadata: {
        groupId,
        creditorUserId,
        amount: amount.toString(),
        currency,
      },
    });

    // 2. Email reminder
    void addEmailJob({
      to: debtor.email,
      subject: `Reminder: You owe ${creditor.name} ${formattedAmount}`,
      templateName: "payment-reminder",
      templateData: {
        debtorName: debtor.name,
        creditorName: creditor.name,
        amount: formattedAmount,
        groupName: group.name,
        groupId,
      },
    });

    logger.info(
      `[ReminderProcessor] ✅ Reminder sent: ${debtor.name} owes ${creditor.name} ${formattedAmount}`
    );
  } catch (err) {
    const error = err as Error;
    logger.error(
      `[ReminderProcessor] Failed for job ${job.id}:`,
      { message: error.message }
    );
    throw error;
  }
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────────────────────────
// Create worker
// ─────────────────────────────────────────────

export function createPaymentReminderWorker(): Worker<PaymentReminderJobData> {
  const worker = new Worker<PaymentReminderJobData>(
    QUEUE_NAMES.PAYMENT_REMINDER,
    processPaymentReminderJob,
    {
      connection: redisConnectionOptions,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`[ReminderWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `[ReminderWorker] Job ${job?.id} failed:`,
      err.message
    );
  });

  worker.on("error", (err) => {
    logger.error("[ReminderWorker] Worker error:", err.message);
  });

  return worker;
}