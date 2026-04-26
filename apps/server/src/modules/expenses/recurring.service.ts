// FILE: apps/server/src/modules/expenses/recurring.service.ts
// PURPOSE: Recurring expense rule CRUD + next run calculation
// DEPENDS ON: prisma, ApiError, expense.service
// LAST UPDATED: F31 - Recurring Expenses Engine

import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { logger } from "../../shared/utils/logger";
import { addRecurringExpenseJob } from "../../config/queue";
import type {
  CreateRecurringInput,
  UpdateRecurringInput,
  Frequency,
} from "./recurring.validation";

// ─────────────────────────────────────────────
// Calculate next run date from frequency
// ─────────────────────────────────────────────

export function calculateNextRun(
  from: Date,
  frequency: Frequency
): Date {
  const next = new Date(from);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

// ─────────────────────────────────────────────
// CREATE RECURRING RULE
// ─────────────────────────────────────────────

export async function createRecurringRule(
  groupId: string,
  userId: string,
  input: CreateRecurringInput
) {
  // Verify admin or member
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  // First run = startDate
  // First run = startDate (handle various date formats)
  let firstRun: Date;

  if (input.startDate) {
    const parsed = new Date(input.startDate);
    firstRun = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    firstRun = new Date();
  }

  // Handle paidBy — filter empty string
  const paidBy =
    input.paidBy && input.paidBy.length > 0
      ? input.paidBy
      : userId;

    const rule = await prisma.recurringRule.create({
    data: {
      groupId,
      createdBy: userId,
      frequency: input.frequency,
      nextRunAt: firstRun,
      isActive: true,
      templateData: {
        title: input.title,
        description: input.description,
        totalAmount: input.totalAmount,
        currency: input.currency ?? "INR",
        category: input.category ?? "general",
        splitType: input.splitType,
        splits: input.splits,
        paidBy,
      },
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  return rule;
}

// ─────────────────────────────────────────────
// LIST RECURRING RULES
// ─────────────────────────────────────────────

export async function listRecurringRules(
  groupId: string,
  userId: string
) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  return prisma.recurringRule.findMany({
    where: { groupId },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────
// UPDATE RECURRING RULE
// ─────────────────────────────────────────────

export async function updateRecurringRule(
  groupId: string,
  ruleId: string,
  userId: string,
  input: UpdateRecurringInput
) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const rule = await prisma.recurringRule.findFirst({
    where: { id: ruleId, groupId },
  });

  if (!rule) {
    throw ApiError.notFound("Recurring rule");
  }

  // Update template data if title/amount changed
  const currentTemplate = rule.templateData as Record<string, unknown>;
  const updatedTemplate = {
    ...currentTemplate,
    ...(input.title && { title: input.title }),
    ...(input.totalAmount && { totalAmount: input.totalAmount }),
  };

  return prisma.recurringRule.update({
    where: { id: ruleId },
    data: {
      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
      ...(input.frequency && { frequency: input.frequency }),
      templateData: updatedTemplate,
    },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

// ─────────────────────────────────────────────
// DELETE RECURRING RULE
// ─────────────────────────────────────────────

export async function deleteRecurringRule(
  groupId: string,
  ruleId: string,
  userId: string
) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const rule = await prisma.recurringRule.findFirst({
    where: { id: ruleId, groupId },
  });

  if (!rule) {
    throw ApiError.notFound("Recurring rule");
  }

  await prisma.recurringRule.delete({
    where: { id: ruleId },
  });
}

// ─────────────────────────────────────────────
// PROCESS DUE RULES (called by CRON)
// Finds all active rules where nextRunAt <= now
// Queues a job for each
// ─────────────────────────────────────────────

export async function processDueRecurringRules(): Promise<void> {
  const now = new Date();

  const dueRules = await prisma.recurringRule.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
    },
    select: {
      id: true,
      groupId: true,
      frequency: true,
    },
  });

  if (dueRules.length === 0) {
    logger.debug("[Recurring] No due rules found");
    return;
  }

  logger.info(
    `[Recurring] Found ${dueRules.length} due rule(s) — queuing jobs`
  );

  for (const rule of dueRules) {
    // Queue job
    await addRecurringExpenseJob({
      recurringRuleId: rule.id,
      groupId: rule.groupId,
    });

    // Update nextRunAt immediately to prevent double-processing
    const nextRun = calculateNextRun(
      now,
      rule.frequency as Frequency
    );

    await prisma.recurringRule.update({
      where: { id: rule.id },
      data: {
        nextRunAt: nextRun,
        lastRunAt: now,
      },
    });

    logger.info(
      `[Recurring] Rule ${rule.id} → next run: ${nextRun.toISOString()}`
    );
  }
}