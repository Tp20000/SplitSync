// FILE: apps/server/src/jobs/processors/index.ts
// PURPOSE: Registers and starts all BullMQ workers
// DEPENDS ON: all processor files
// LAST UPDATED: F32 - Payment Reminder Jobs

import { Worker } from "bullmq";
import { createEmailWorker } from "./email.processor";
import { createNotificationWorker } from "./notification.processor";
import { createRecurringExpenseWorker } from "./recurring.processor";
import { createPaymentReminderWorker } from "./reminder.processor";

let workers: Worker[] = [];

export function startAllWorkers(): void {
  console.log("[Workers] Starting all BullMQ workers...");

  workers = [
    createEmailWorker(),
    createNotificationWorker(),
    createRecurringExpenseWorker(),
    createPaymentReminderWorker(),
  ];

  console.log(`[Workers] ${workers.length} workers started`);
}

export async function stopAllWorkers(): Promise<void> {
  console.log("[Workers] Stopping all workers...");
  await Promise.all(workers.map((worker) => worker.close()));
  workers = [];
  console.log("[Workers] All workers stopped");
}