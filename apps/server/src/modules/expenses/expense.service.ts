// FILE: apps/server/src/modules/expenses/expense.service.ts
// PURPOSE: Expense business logic — CRUD, history, pagination
// DEPENDS ON: prisma, split.service, ApiError, decimal.js
// LAST UPDATED: F13 - Expense CRUD API

import Decimal from "decimal.js";
import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { cacheDel } from "../../config/redis";
import { calculateSplits } from "./split.service";
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
  SplitType,
} from "./expense.validation";
import {
  emitExpenseCreated,
  emitExpenseUpdated,
  emitExpenseDeleted,
  emitBalanceUpdated,
} from "../../socket/emitters";
import { addEmailJob, addNotificationJob } from "../../config/queue";

// ─────────────────────────────────────────────
// Verify all split users are group members
// ─────────────────────────────────────────────

async function verifySplitMembers(
  groupId: string,
  userIds: string[]
): Promise<void> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const memberIdSet = new Set(members.map((m) => m.userId));

  for (const userId of userIds) {
    if (!memberIdSet.has(userId)) {
      throw ApiError.badRequest(
        `User ${userId} is not a member of this group`,
        ErrorCode.NOT_GROUP_MEMBER
      );
    }
  }
}

// ─────────────────────────────────────────────
// CREATE EXPENSE
// ─────────────────────────────────────────────

export async function createExpense(
  groupId: string,
  userId: string,
  input: CreateExpenseInput
) {
  const paidBy = input.paidBy ?? userId;

  // Get unique user IDs from splits
  const splitUserIds = input.splits.map((s) => s.userId);
  const allUserIds = [...new Set([paidBy, ...splitUserIds])];

  // Verify all users are group members
  await verifySplitMembers(groupId, allUserIds);

  // Calculate split amounts
  const calculatedSplits = calculateSplits(
    input.totalAmount,
    input.splitType,
    input.splits
  );

  // Create expense + splits + history in transaction
  const expense = await prisma.$transaction(async (tx) => {
    // 1. Create expense
    const newExpense = await tx.expense.create({
      data: {
        groupId,
        paidBy,
        title: input.title,
        description: input.description,
        totalAmount: new Decimal(input.totalAmount),
        currency: input.currency ?? "INR",
        category: input.category ?? "general",
        splitType: input.splitType,
        expenseDate: input.expenseDate
          ? new Date(input.expenseDate)
          : new Date(),
        version: 1,
      },
    });

    // 2. Create split records
    await tx.expenseSplit.createMany({
      data: calculatedSplits.map((split) => ({
        expenseId: newExpense.id,
        userId: split.userId,
        owedAmount: split.owedAmount,
        isSettled: false,
      })),
    });

    // 3. Record history
    await tx.expenseHistory.create({
      data: {
        expenseId: newExpense.id,
        changedBy: userId,
        action: "created",
        newData: {
          title: input.title,
          totalAmount: input.totalAmount,
          splitType: input.splitType,
          paidBy,
          category: input.category ?? "general",
          splits: calculatedSplits.map((s) => ({
            userId: s.userId,
            owedAmount: s.owedAmount.toFixed(2),
          })),
        },
      },
    });

    return newExpense;
  });


  function formatAmountForNotification(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

  // Fetch complete expense with relations
  const complete = await getExpenseById(groupId, expense.id, userId);

  // Invalidate caches
    await cacheDel(`user:${userId}:groups`);

  // Emit real-time events
  emitExpenseCreated(
    groupId,
    complete as unknown as Record<string, unknown>,
    userId
  );
  emitBalanceUpdated(groupId);

   // Notify all group members except the creator
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true },
  });

    // Get user share amounts for email
    // Get user share amounts for email
  const splitAmountsMap = new Map<string, string>();
  if (complete && typeof complete === "object") {
    const c = complete as unknown as {
      splits?: Array<{ userId: string; owedAmount: string }>;
    };
    c.splits?.forEach((s) => {
      splitAmountsMap.set(s.userId, s.owedAmount);
    });
  }

  for (const member of groupMembers) {
    if (member.userId === userId) continue;

    // Get member email for sending
    const memberUser = await prisma.user.findUnique({
      where: { id: member.userId },
      select: { email: true, name: true },
    });

    if (!memberUser) continue;

    void addNotificationJob({
      userId: member.userId,
      type: "expense_created",
      title: "New expense added",
      body: `${creator?.name ?? "Someone"} added "${input.title}" (${formatAmountForNotification(input.totalAmount, input.currency ?? "INR")}) in ${group?.name ?? "a group"}`,
      metadata: {
        groupId,
        expenseId: expense.id,
      },
    });

    // Email notification
    void addEmailJob({
      to: memberUser.email,
      subject: `New expense in ${group?.name ?? "your group"}`,
      templateName: "expense-created",
      templateData: {
        recipientName: memberUser.name,
        payerName: creator?.name ?? "Someone",
        expenseTitle: input.title,
        amount: formatAmountForNotification(
          input.totalAmount,
          input.currency ?? "INR"
        ),
        groupName: group?.name ?? "your group",
        yourShare: formatAmountForNotification(
          parseFloat(
            splitAmountsMap.get(member.userId) ?? "0"
          ),
          input.currency ?? "INR"
        ),
        groupId,
      },
    });
  }

  return complete;
}

// ─────────────────────────────────────────────
// LIST EXPENSES (paginated + filtered)
// ─────────────────────────────────────────────

export async function listExpenses(
  groupId: string,
  userId: string,
  query: ListExpensesQuery
) {
  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const page = parseInt(query.page, 10);
  const limit = Math.min(parseInt(query.limit, 10), 50);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {
    groupId,
    isDeleted: false,
  };

  if (query.category) {
    where.category = query.category;
  }

  if (query.paidBy) {
    where.paidBy = query.paidBy;
  }

  if (query.search) {
    where.title = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  // Sort
  const orderBy: Record<string, string> = {};
  orderBy[query.sortBy] = query.sortOrder;

  // Query with count
  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        paidByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    expenses: expenses.map(formatExpense),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ─────────────────────────────────────────────
// GET SINGLE EXPENSE
// ─────────────────────────────────────────────

export async function getExpenseById(
  groupId: string,
  expenseId: string,
  userId: string
) {
  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const expense = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      groupId,
      isDeleted: false,
    },
    include: {
      paidByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      splits: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          history: true,
        },
      },
    },
  });

  if (!expense) {
    throw ApiError.notFound("Expense");
  }

  return formatExpense(expense);
}

// ─────────────────────────────────────────────
// UPDATE EXPENSE
// ─────────────────────────────────────────────

export async function updateExpense(
  groupId: string,
  expenseId: string,
  userId: string,
  input: UpdateExpenseInput
) {
  // Fetch current expense
  const current = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    include: {
      splits: true,
    },
  });

  if (!current) {
    throw ApiError.notFound("Expense");
  }

  // Optimistic concurrency check
  if (input.version !== current.version) {
    throw ApiError.conflict(
      "This expense was modified by someone else. Please refresh and try again.",
      ErrorCode.EXPENSE_LOCKED
    );
  }

  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  // Prepare old data for history
  const oldData = {
    title: current.title,
    totalAmount: current.totalAmount.toString(),
    splitType: current.splitType,
    paidBy: current.paidBy,
    category: current.category,
    splits: current.splits.map((s) => ({
      userId: s.userId,
      owedAmount: s.owedAmount.toString(),
    })),
  };

  // Determine new values
  const newTitle = input.title ?? current.title;
  const newAmount = input.totalAmount
    ? new Decimal(input.totalAmount)
    : current.totalAmount;
  const newSplitType = (input.splitType ?? current.splitType) as SplitType;
  const newPaidBy = input.paidBy ?? current.paidBy;
  const newCategory = input.category ?? current.category;
  const newCurrency = input.currency ?? current.currency;

  // Recalculate splits if amount, type, or splits changed
  let newSplits: {
    userId: string;
    owedAmount: Decimal;
  }[] | null = null;

  if (input.splits && input.totalAmount) {
    const splitUserIds = input.splits.map((s) => s.userId);
    await verifySplitMembers(groupId, [
      ...new Set([newPaidBy, ...splitUserIds]),
    ]);

    newSplits = calculateSplits(
      input.totalAmount,
      newSplitType,
      input.splits
    );
  } else if (input.splits) {
    const splitUserIds = input.splits.map((s) => s.userId);
    await verifySplitMembers(groupId, splitUserIds);

    newSplits = calculateSplits(
      Number(newAmount),
      newSplitType,
      input.splits
    );
  }

  // Transaction: update expense + splits + history
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update expense
    const updatedExpense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        title: newTitle,
        totalAmount: newAmount,
        currency: newCurrency,
        category: newCategory,
        splitType: newSplitType,
        paidBy: newPaidBy,
        ...(input.expenseDate && {
          expenseDate: new Date(input.expenseDate),
        }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        version: { increment: 1 },
      },
    });

    // 2. Update splits if recalculated
    if (newSplits) {
      // Delete old splits
      await tx.expenseSplit.deleteMany({
        where: { expenseId },
      });

      // Create new splits
      await tx.expenseSplit.createMany({
        data: newSplits.map((split) => ({
          expenseId,
          userId: split.userId,
          owedAmount: split.owedAmount,
          isSettled: false,
        })),
      });
    }

    // 3. Record history
    await tx.expenseHistory.create({
      data: {
        expenseId,
        changedBy: userId,
        action: "updated",
        oldData,
        newData: {
          title: newTitle,
          totalAmount: newAmount.toString(),
          splitType: newSplitType,
          paidBy: newPaidBy,
          category: newCategory,
          ...(newSplits && {
            splits: newSplits.map((s) => ({
              userId: s.userId,
              owedAmount: s.owedAmount.toFixed(2),
            })),
          }),
        },
      },
    });

    return updatedExpense;
  });

  // Return full expense
    // Emit real-time events
  const result = await getExpenseById(groupId, updated.id, userId);
  emitExpenseUpdated(
    groupId,
    result as unknown as Record<string, unknown>,
    userId
  );
  emitBalanceUpdated(groupId);

  // Notify participants
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const updater = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true },
  });

  for (const member of groupMembers) {
    if (member.userId === userId) continue;

    void addNotificationJob({
      userId: member.userId,
      type: "expense_updated",
      title: "Expense updated",
      body: `${updater?.name ?? "Someone"} updated "${newTitle}" in ${group?.name ?? "a group"}`,
      metadata: {
        groupId,
        expenseId: updated.id,
      },
    });
  }

  return result;
}

// ─────────────────────────────────────────────
// DELETE (SOFT) EXPENSE
// ─────────────────────────────────────────────

export async function deleteExpense(
  groupId: string,
  expenseId: string,
  userId: string
) {
  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    include: { splits: true },
  });

  if (!expense) {
    throw ApiError.notFound("Expense");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Soft-delete expense
    await tx.expense.update({
      where: { id: expenseId },
      data: {
        isDeleted: true,
        version: { increment: 1 },
      },
    });

    // 2. Record history
    await tx.expenseHistory.create({
      data: {
        expenseId,
        changedBy: userId,
        action: "deleted",
        oldData: {
          title: expense.title,
          totalAmount: expense.totalAmount.toString(),
          splitType: expense.splitType,
          paidBy: expense.paidBy,
        },
      },
    });
  });

    // Emit real-time events
  emitExpenseDeleted(groupId, expenseId, userId);
  emitBalanceUpdated(groupId);

  // Notify participants
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  const deleter = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true },
  });

  for (const member of groupMembers) {
    if (member.userId === userId) continue;

    void addNotificationJob({
      userId: member.userId,
      type: "expense_deleted",
      title: "Expense deleted",
      body: `${deleter?.name ?? "Someone"} deleted "${expense.title}" in ${group?.name ?? "a group"}`,
      metadata: {
        groupId,
        expenseId,
      },
    });
  }
}

// ─────────────────────────────────────────────
// GET EXPENSE HISTORY — stub (F26)
// ─────────────────────────────────────────────

export async function getExpenseHistory(
  groupId: string,
  expenseId: string,
  userId: string
) {
  // Verify membership
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  const history = await prisma.expenseHistory.findMany({
    where: { expenseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { changedAt: "desc" },
  });

  return history;
}

// ─────────────────────────────────────────────
// Format expense for API response
// ─────────────────────────────────────────────

function formatExpense(expense: Record<string, unknown>) {
  const e = expense as Record<string, unknown> & {
    totalAmount: { toString: () => string } | string;
    splits: Array<{
      owedAmount: { toString: () => string } | string;
      [key: string]: unknown;
    }>;
  };

  return {
    ...e,
    totalAmount:
      typeof e.totalAmount === "object"
        ? e.totalAmount.toString()
        : e.totalAmount,
    splits: e.splits?.map((s) => ({
      ...s,
      owedAmount:
        typeof s.owedAmount === "object"
          ? s.owedAmount.toString()
          : s.owedAmount,
    })),
  };

  // ─────────────────────────────────────────────
// Format amount for notification text
// ─────────────────────────────────────────────


}