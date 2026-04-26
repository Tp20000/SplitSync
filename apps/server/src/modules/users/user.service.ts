// FILE: apps/server/src/modules/users/user.service.ts
// PURPOSE: User profile queries and updates
// DEPENDS ON: prisma, ApiError, invalidateUserCache
// LAST UPDATED: F06 - Auth Middleware + Route Protection

import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { invalidateUserCache } from "../auth/auth.middleware";
import { calculateUserBalances } from "../expenses/balance.service";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  currencyPref?: string;
  timezone?: string;
}

// ─────────────────────────────────────────────
// GET CURRENT USER PROFILE
// ─────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      currencyPref: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          groupMembers: true,
          paidExpenses: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound("User");
  }

  return user;
}

// ─────────────────────────────────────────────
// UPDATE USER PROFILE
// ─────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  currencyPref?: string;
  timezone?: string;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
) {
  if (input.currencyPref && input.currencyPref.length !== 3) {
    throw ApiError.badRequest(
      "Currency code must be exactly 3 characters (e.g. INR, USD)",
      ErrorCode.INVALID_INPUT
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.currencyPref && {
        currencyPref: input.currencyPref.toUpperCase(),
      }),
      ...(input.timezone && { timezone: input.timezone }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      currencyPref: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await invalidateUserCache(userId);

  return updated;
}

// ─────────────────────────────────────────────
// GET USER BALANCES (across all groups)
// ─────────────────────────────────────────────

export async function getUserBalances(userId: string) {
  const balances = await calculateUserBalances(userId);
  return balances;
}

// ─────────────────────────────────────────────
// GET USER ACTIVITY (across all groups)
// ─────────────────────────────────────────────

export async function getUserActivity(
  userId: string,
  limit = 30
) {
  // Get recent expenses where user is involved (paid or split)
  const recentExpenses = await prisma.expense.findMany({
    where: {
      isDeleted: false,
      OR: [
        { paidBy: userId },
        { splits: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      totalAmount: true,
      currency: true,
      category: true,
      paidBy: true,
      createdAt: true,
      group: {
        select: { id: true, name: true },
      },
      paidByUser: {
        select: { id: true, name: true },
      },
      splits: {
        where: { userId },
        select: { owedAmount: true },
      },
    },
  });

  // Get recent settlements where user is involved
  const recentSettlements = await prisma.settlement.findMany({
    where: {
      OR: [
        { paidBy: userId },
        { paidTo: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      currency: true,
      paidBy: true,
      paidTo: true,
      note: true,
      settledAt: true,
      createdAt: true,
      group: {
        select: { id: true, name: true },
      },
      paidByUser: {
        select: { id: true, name: true },
      },
      paidToUser: {
        select: { id: true, name: true },
      },
    },
  });

  // Get recent group joins
  const recentJoins = await prisma.groupMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    take: 10,
    select: {
      id: true,
      joinedAt: true,
      role: true,
      group: {
        select: { id: true, name: true },
      },
    },
  });

  // Build unified activity list
  const activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    amount: string | null;
    currency: string | null;
    groupId: string;
    groupName: string;
    userId: string;
    userName: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }> = [];

  // Map expenses
  for (const expense of recentExpenses) {
    const isPayer = expense.paidBy === userId;
    const userShare = expense.splits[0]?.owedAmount;

    activities.push({
      id: `expense-${expense.id}`,
      type: isPayer ? "expense_paid" : "expense_split",
      title: isPayer
        ? `You paid for "${expense.title}"`
        : `${expense.paidByUser.name} added "${expense.title}"`,
      description: isPayer
        ? `You paid ${formatAmt(expense.totalAmount, expense.currency)} in ${expense.group.name}`
        : `Your share: ${userShare ? formatAmt(userShare, expense.currency) : ""}`,
      amount: expense.totalAmount.toString(),
      currency: expense.currency,
      groupId: expense.group.id,
      groupName: expense.group.name,
      userId: expense.paidByUser.id,
      userName: expense.paidByUser.name,
      timestamp: expense.createdAt.toISOString(),
      metadata: {
        expenseId: expense.id,
        category: expense.category,
        isPayer,
      },
    });
  }

  // Map settlements
  for (const settlement of recentSettlements) {
    const isPayer = settlement.paidBy === userId;

    activities.push({
      id: `settlement-${settlement.id}`,
      type: isPayer ? "settlement_paid" : "settlement_received",
      title: isPayer
        ? `You paid ${settlement.paidToUser.name}`
        : `${settlement.paidByUser.name} paid you`,
      description: `${formatAmt(settlement.amount, settlement.currency)} in ${settlement.group.name}`,
      amount: settlement.amount.toString(),
      currency: settlement.currency,
      groupId: settlement.group.id,
      groupName: settlement.group.name,
      userId: isPayer
        ? settlement.paidToUser.id
        : settlement.paidByUser.id,
      userName: isPayer
        ? settlement.paidToUser.name
        : settlement.paidByUser.name,
      timestamp: settlement.createdAt.toISOString(),
      metadata: {
        settlementId: settlement.id,
        isPayer,
        note: settlement.note,
      },
    });
  }

  // Map group joins
  for (const join of recentJoins) {
    activities.push({
      id: `join-${join.id}`,
      type: "group_joined",
      title: `You joined ${join.group.name}`,
      description: `As ${join.role}`,
      amount: null,
      currency: null,
      groupId: join.group.id,
      groupName: join.group.name,
      userId,
      userName: "",
      timestamp: join.joinedAt.toISOString(),
      metadata: { role: join.role },
    });
  }

  // Sort by timestamp desc + limit
  activities.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() -
      new Date(a.timestamp).getTime()
  );

  return activities.slice(0, limit);
}

function formatAmt(
  amount: unknown,
  currency: string
): string {
  const num =
    typeof amount === "object" && amount !== null
      ? Number(amount.toString())
      : Number(amount);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}