// FILE: apps/server/src/modules/analytics/analytics.service.ts
// PURPOSE: Compute expense analytics — summary, trends, categories
// DEPENDS ON: prisma, decimal.js
// LAST UPDATED: F35 - Analytics Dashboard

import Decimal from "decimal.js";
import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";

// ─────────────────────────────────────────────
// Verify membership helper
// ─────────────────────────────────────────────

async function assertMember(
  groupId: string,
  userId: string
): Promise<void> {
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
}

// ─────────────────────────────────────────────
// GET SUMMARY
// ─────────────────────────────────────────────

export async function getGroupSummary(
  groupId: string,
  userId: string
) {
  await assertMember(groupId, userId);

  const expenses = await prisma.expense.findMany({
    where: { groupId, isDeleted: false },
    select: {
      totalAmount: true,
      currency: true,
      paidBy: true,
      createdAt: true,
      category: true,
    },
  });

  if (expenses.length === 0) {
    return {
      totalExpenses: "0",
      expenseCount: 0,
      avgPerExpense: "0",
      activeMembers: 0,
      topCategory: null,
      thisMonthTotal: "0",
      lastMonthTotal: "0",
      monthOverMonthChange: 0,
    };
  }

  // Calculate totals
  let total = new Decimal(0);
  expenses.forEach((e) => {
    total = total.plus(e.totalAmount);
  });

  const avg = total.div(expenses.length);

  // Count active members (those who paid at least once)
  const activePayerIds = new Set(expenses.map((e) => e.paidBy));

  // Top category
  const categoryCounts: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryCounts[e.category] =
      (categoryCounts[e.category] ?? 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? null;

  // Month-over-month comparison
  const now = new Date();
  const thisMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );
  const lastMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  let thisMonthTotal = new Decimal(0);
  let lastMonthTotal = new Decimal(0);

  expenses.forEach((e) => {
    const date = new Date(e.createdAt);
    if (date >= thisMonthStart) {
      thisMonthTotal = thisMonthTotal.plus(e.totalAmount);
    } else if (date >= lastMonthStart && date <= lastMonthEnd) {
      lastMonthTotal = lastMonthTotal.plus(e.totalAmount);
    }
  });

  const monthOverMonthChange =
    lastMonthTotal.isZero()
      ? 100
      : thisMonthTotal
          .minus(lastMonthTotal)
          .div(lastMonthTotal)
          .mul(100)
          .toNumber();

  return {
    totalExpenses: total.toFixed(2),
    expenseCount: expenses.length,
    avgPerExpense: avg.toFixed(2),
    activeMembers: activePayerIds.size,
    topCategory,
    thisMonthTotal: thisMonthTotal.toFixed(2),
    lastMonthTotal: lastMonthTotal.toFixed(2),
    monthOverMonthChange: Math.round(monthOverMonthChange),
  };
}

// ─────────────────────────────────────────────
// GET TRENDS (spending over time)
// ─────────────────────────────────────────────

export async function getSpendingTrends(
  groupId: string,
  userId: string,
  period: "daily" | "weekly" | "monthly" = "monthly",
  months = 6
) {
  await assertMember(groupId, userId);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const expenses = await prisma.expense.findMany({
    where: {
      groupId,
      isDeleted: false,
      expenseDate: { gte: startDate },
    },
    select: {
      totalAmount: true,
      expenseDate: true,
      currency: true,
    },
    orderBy: { expenseDate: "asc" },
  });

  // Group by period
  const grouped: Record<
    string,
    { label: string; total: Decimal; count: number }
  > = {};

  expenses.forEach((expense) => {
    const date = new Date(expense.expenseDate);
    let key: string;
    let label: string;

    if (period === "daily") {
      key = date.toISOString().split("T")[0];
      label = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } else if (period === "weekly") {
      // Get week start (Monday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      key = weekStart.toISOString().split("T")[0];
      label = `Week of ${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      label = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
    }

    if (!grouped[key]) {
      grouped[key] = { label, total: new Decimal(0), count: 0 };
    }
    grouped[key].total = grouped[key].total.plus(expense.totalAmount);
    grouped[key].count++;
  });

  // Fill missing periods with 0
  const result = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      key,
      label: data.label,
      total: parseFloat(data.total.toFixed(2)),
      count: data.count,
    }));

  return result;
}

// ─────────────────────────────────────────────
// GET CATEGORY BREAKDOWN
// ─────────────────────────────────────────────

export async function getCategoryBreakdown(
  groupId: string,
  userId: string
) {
  await assertMember(groupId, userId);

  const expenses = await prisma.expense.groupBy({
    by: ["category"],
    where: { groupId, isDeleted: false },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  let grandTotal = new Decimal(0);
  expenses.forEach((e) => {
    grandTotal = grandTotal.plus(e._sum.totalAmount ?? 0);
  });

  const breakdown = expenses
    .map((e) => {
      const amount = new Decimal(e._sum.totalAmount ?? 0);
      const percentage = grandTotal.isZero()
        ? 0
        : amount.div(grandTotal).mul(100).toNumber();

      return {
        category: e.category,
        total: parseFloat(amount.toFixed(2)),
        count: e._count.id,
        percentage: Math.round(percentage * 10) / 10,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    breakdown,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}

// ─────────────────────────────────────────────
// GET MEMBER SPENDING
// ─────────────────────────────────────────────

export async function getMemberSpending(
  groupId: string,
  userId: string
) {
  await assertMember(groupId, userId);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });

  const memberSpending = await Promise.all(
    members.map(async (member) => {
      // How much this member paid
      const paid = await prisma.expense.aggregate({
        where: {
          groupId,
          paidBy: member.userId,
          isDeleted: false,
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      // How much this member owes
      const owed = await prisma.expenseSplit.aggregate({
        where: {
          userId: member.userId,
          expense: { groupId, isDeleted: false },
        },
        _sum: { owedAmount: true },
      });

      return {
        userId: member.userId,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        totalPaid: parseFloat(
          new Decimal(
            paid._sum.totalAmount ?? 0
          ).toFixed(2)
        ),
        totalOwed: parseFloat(
          new Decimal(
            owed._sum.owedAmount ?? 0
          ).toFixed(2)
        ),
        expenseCount: paid._count.id,
      };
    })
  );

  return memberSpending.sort(
    (a, b) => b.totalPaid - a.totalPaid
  );
}