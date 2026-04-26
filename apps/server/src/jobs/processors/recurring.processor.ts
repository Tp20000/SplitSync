// FILE: apps/server/src/jobs/processors/recurring.processor.ts
// PURPOSE: Processes recurring expense jobs — creates expense from template
// DEPENDS ON: bullmq, prisma, expense.service, queue
// LAST UPDATED: F31 - Recurring Expenses Engine

import { Job } from "bullmq";
import Decimal from "decimal.js";
import {
  RecurringExpenseJobData,
  QUEUE_NAMES,
  Worker,
} from "../../config/queue";
import { redisConnectionOptions } from "../../config/redis";
import prisma from "../../config/database";
import { calculateSplits } from "../../modules/expenses/split.service";
import {
  emitExpenseCreated,
  emitBalanceUpdated,
} from "../../socket/emitters";
import { addNotificationJob } from "../../config/queue";
import { logger } from "../../shared/utils/logger";
import type { SplitType } from "../../modules/expenses/expense.validation";

// ─────────────────────────────────────────────
// Process recurring expense job
// ─────────────────────────────────────────────

async function processRecurringExpenseJob(
  job: Job<RecurringExpenseJobData>
): Promise<void> {
  const { recurringRuleId, groupId } = job.data;

  logger.info(
    `[RecurringProcessor] Processing rule: ${recurringRuleId}`
  );

  // Fetch the rule
  const rule = await prisma.recurringRule.findUnique({
    where: { id: recurringRuleId },
    include: {
      group: { select: { id: true, name: true } },
    },
  });

  if (!rule) {
    logger.warn(
      `[RecurringProcessor] Rule ${recurringRuleId} not found — skipping`
    );
    return;
  }

  if (!rule.isActive) {
    logger.info(
      `[RecurringProcessor] Rule ${recurringRuleId} is inactive — skipping`
    );
    return;
  }

  // Extract template
  const template = rule.templateData as {
    title: string;
    description?: string;
    totalAmount: number;
    currency: string;
    category: string;
    splitType: SplitType;
    splits: Array<{ userId: string; value?: number }>;
    paidBy: string;
  };

  // Verify all split users still in group
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = new Set(groupMembers.map((m) => m.userId));

  const validSplits = template.splits.filter((s) =>
    memberIds.has(s.userId)
  );

  if (validSplits.length === 0) {
    logger.warn(
      `[RecurringProcessor] No valid split members for rule ${recurringRuleId}`
    );
    return;
  }

  // Calculate splits
  const calculatedSplits = calculateSplits(
    template.totalAmount,
    template.splitType,
    validSplits
  );

  // Create expense in transaction
  const expense = await prisma.$transaction(async (tx) => {
    const newExpense = await tx.expense.create({
      data: {
        groupId,
        paidBy: memberIds.has(template.paidBy)
          ? template.paidBy
          : validSplits[0].userId,
        title: template.title,
        description: template.description,
        totalAmount: new Decimal(template.totalAmount),
        currency: template.currency,
        category: template.category,
        splitType: template.splitType,
        isRecurring: true,
        version: 1,
      },
    });

    await tx.expenseSplit.createMany({
      data: calculatedSplits.map((s) => ({
        expenseId: newExpense.id,
        userId: s.userId,
        owedAmount: s.owedAmount,
        isSettled: false,
      })),
    });

    await tx.expenseHistory.create({
      data: {
        expenseId: newExpense.id,
        changedBy: rule.createdBy,
        action: "created",
        newData: {
          title: template.title,
          totalAmount: template.totalAmount,
          splitType: template.splitType,
          paidBy: template.paidBy,
          source: "recurring",
          ruleId: recurringRuleId,
        },
      },
    });

    return newExpense;
  });

  logger.info(
    `[RecurringProcessor] Created expense ${expense.id} from rule ${recurringRuleId}`
  );

  // Emit socket events
  emitExpenseCreated(
    groupId,
    { id: expense.id, title: expense.title } as Record<
      string,
      unknown
    >,
    rule.createdBy
  );
  emitBalanceUpdated(groupId);

  // Notify group members
  const creator = await prisma.user.findUnique({
    where: { id: rule.createdBy },
    select: { name: true },
  });

  for (const member of groupMembers) {
    void addNotificationJob({
      userId: member.userId,
      type: "expense_created",
      title: "Recurring expense added",
      body: `"${template.title}" was automatically added to ${rule.group.name} (${template.currency} ${template.totalAmount})`,
      metadata: {
        groupId,
        expenseId: expense.id,
        isRecurring: true,
      },
    });
  }
}

// ─────────────────────────────────────────────
// Create worker
// ─────────────────────────────────────────────

export function createRecurringExpenseWorker(): Worker<RecurringExpenseJobData> {
  const worker = new Worker<RecurringExpenseJobData>(
    QUEUE_NAMES.RECURRING_EXPENSE,
    processRecurringExpenseJob,
    {
      connection: redisConnectionOptions,
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    logger.info(`[RecurringWorker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `[RecurringWorker] Job ${job?.id} failed:`,
      err.message
    );
  });

  worker.on("error", (err) => {
    logger.error("[RecurringWorker] Worker error:", err.message);
  });

  return worker;
}