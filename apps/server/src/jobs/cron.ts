// FILE: apps/server/src/jobs/cron.ts
// PURPOSE: CRON jobs — recurring expenses + payment reminders
// DEPENDS ON: node-cron, recurring.service, balance.service
// LAST UPDATED: F32 - Payment Reminder Jobs

import cron from "node-cron";
import { processDueRecurringRules } from "../modules/expenses/recurring.service";
import { sendPaymentReminders } from "../modules/expenses/balance.service";
import { logger } from "../shared/utils/logger";
import { refreshExchangeRates } from "../shared/utils/currency";

let recurringJob: cron.ScheduledTask | null = null;
let reminderJob: cron.ScheduledTask | null = null;

let cronJobs: cron.ScheduledTask[] = [];

// ─────────────────────────────────────────────
// Start all CRON jobs
// ─────────────────────────────────────────────

export function startCronJobs(): void {
  // 1. Recurring expenses — every hour
  recurringJob = cron.schedule("0 * * * *", async () => {
    logger.info("[CRON] Running recurring expense check...");
    try {
      await processDueRecurringRules();
      logger.info("[CRON] Recurring check complete");
    } catch (err) {
      const error = err as Error;
      logger.error("[CRON] Recurring check failed:", {
        message: error.message,
      });
    }
  });

  // 2. Payment reminders — daily at 9:00 AM
  reminderJob = cron.schedule("0 9 * * *", async () => {
    logger.info("[CRON] Running payment reminders...");
    try {
      await sendPaymentReminders();
      logger.info("[CRON] Payment reminders complete");
    } catch (err) {
      const error = err as Error;
      logger.error("[CRON] Payment reminders failed:", {
        message: error.message,
      });
    }
  });

  logger.info("[CRON] Jobs scheduled:");
  logger.info("[CRON]   Recurring expenses: every hour (0 * * * *)");
  logger.info("[CRON]   Payment reminders: daily 9 AM (0 9 * * *)");

    // 3. Exchange rate refresh — every 6 hours
  const rateJob = cron.schedule("0 */6 * * *", async () => {
    logger.info("[CRON] Refreshing exchange rates...");
    try {
      await refreshExchangeRates();
      logger.info("[CRON] Exchange rates refreshed");
    } catch (err) {
      const error = err as Error;
      logger.error("[CRON] Rate refresh failed:", {
        message: error.message,
      });
    }
  });

  logger.info("[CRON]   Exchange rates: every 6 hours (0 */6 * * *)");
}

// ─────────────────────────────────────────────
// Stop all CRON jobs
// ─────────────────────────────────────────────

export function stopCronJobs(): void {
  cronJobs.forEach((job) => job.stop());
  cronJobs = [];
  logger.info("[CRON] All jobs stopped");
}


// ─────────────────────────────────────────────
// Manual triggers (for testing)
// ─────────────────────────────────────────────

export async function triggerRecurringCheck(): Promise<void> {
  logger.info("[CRON] Manual recurring check triggered");
  await processDueRecurringRules();
}

export async function triggerPaymentReminders(): Promise<void> {
  logger.info("[CRON] Manual payment reminders triggered");
  await sendPaymentReminders();
}