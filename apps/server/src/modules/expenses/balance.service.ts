// FILE: apps/server/src/modules/expenses/balance.service.ts
// PURPOSE: Calculates net balances from expenses + settlements using decimal.js
// DEPENDS ON: prisma, decimal.js
// LAST UPDATED: F16 - Balance Calculation Engine

import Decimal from "decimal.js";
import prisma from "../../config/database";
import {
  simplifyWithStats,
  countNaiveDebts,
  type SimplifiedDebt,
  type SimplificationResult,
  type PersonInfo,
} from "../settlements/debt-simplifier";
import {
  cacheGet,
  cacheSet,
} from "../../config/redis";
import { addPaymentReminderJob } from "../../config/queue";
import { logger } from "../../shared/utils/logger";
import { convertCurrency } from "../../shared/utils/currency";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPaid: string;     // total this user paid for expenses
  totalOwed: string;     // total this user owes from splits
  totalSettledPaid: string;  // total settlements paid
  totalSettledReceived: string; // total settlements received
  netBalance: string;    // positive = owed money, negative = owes money
}

export type PairwiseDebt = SimplifiedDebt;

export interface GroupBalanceResult {
  groupId: string;
  currency: string;
  members: MemberBalance[];
  debts: PairwiseDebt[];
  totalExpenses: string;
  expenseCount: number;
  simplificationStats: {
    naiveCount: number;
    simplifiedCount: number;
    savings: number;
    savingsPercent: number;
  };
}

// ─────────────────────────────────────────────
// CALCULATE GROUP BALANCES
//
// Algorithm:
// 1. For each expense (non-deleted):
//    - payer gets +totalAmount (they paid for everyone)
//    - each split participant gets -owedAmount (they owe)
// 2. For each settlement:
//    - payer gets -amount (they paid settlement)
//    - receiver gets +amount (they received settlement)
// 3. Net balance = totalPaid - totalOwed + settledPaid - settledReceived
//    positive = group owes you money
//    negative = you owe the group money
// 4. Calculate pairwise debts from net balances
// ─────────────────────────────────────────────

export async function calculateGroupBalances(
  groupId: string
): Promise<GroupBalanceResult> {
  // 1. Get all group members
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          currencyPref: true,
        },
      },
    },
  });

  // 2. Get all non-deleted expenses with splits
  const expenses = await prisma.expense.findMany({
    where: { groupId, isDeleted: false },
    include: {
      splits: true,
    },
  });

  // 3. Get all settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
  });

  // 4. Build balance map: userId → { paid, owed, settledPaid, settledReceived }
  const balanceMap = new Map<
    string,
    {
      totalPaid: Decimal;
      totalOwed: Decimal;
      settledPaid: Decimal;
      settledReceived: Decimal;
    }
  >();

  // Initialize all members
  for (const member of members) {
    balanceMap.set(member.userId, {
      totalPaid: new Decimal(0),
      totalOwed: new Decimal(0),
      settledPaid: new Decimal(0),
      settledReceived: new Decimal(0),
    });
  }

    // 5. Process expenses (convert to group base currency)
  let totalExpenses = new Decimal(0);

  // Determine group currency from first member's preference
  const groupCurrency = members[0]?.user?.currencyPref ?? "INR";

  for (const expense of expenses) {
    const expenseCurrency = expense.currency ?? groupCurrency;

    // Convert total to group currency
    const convertedTotal = await convertCurrency(
      expense.totalAmount,
      expenseCurrency,
      groupCurrency
    );

    totalExpenses = totalExpenses.plus(convertedTotal);

    // Payer gets credit (converted)
    const payerBalance = balanceMap.get(expense.paidBy);
    if (payerBalance) {
      payerBalance.totalPaid = payerBalance.totalPaid.plus(
        convertedTotal
      );
    }

    // Each split participant owes their share (converted)
    for (const split of expense.splits) {
      const splitBalance = balanceMap.get(split.userId);
      if (splitBalance) {
        const convertedSplit = await convertCurrency(
          split.owedAmount,
          expenseCurrency,
          groupCurrency
        );
        splitBalance.totalOwed = splitBalance.totalOwed.plus(
          convertedSplit
        );
      }
    }
  }

    // 6. Process settlements (convert to group currency)
  for (const settlement of settlements) {
    const settlementCurrency = settlement.currency ?? groupCurrency;

    const convertedAmount = await convertCurrency(
      settlement.amount,
      settlementCurrency,
      groupCurrency
    );

    const payerBalance = balanceMap.get(settlement.paidBy);
    if (payerBalance) {
      payerBalance.settledPaid = payerBalance.settledPaid.plus(
        convertedAmount
      );
    }

    const receiverBalance = balanceMap.get(settlement.paidTo);
    if (receiverBalance) {
      receiverBalance.settledReceived =
        receiverBalance.settledReceived.plus(convertedAmount);
    }
  }

  // 7. Calculate net balances
  const memberBalances: MemberBalance[] = [];

  for (const member of members) {
    const bal = balanceMap.get(member.userId);
    if (!bal) continue;

    // Net = (what you paid + settlements received) - (what you owe + settlements you made)
    // Positive = others owe you, Negative = you owe others
    const netBalance = bal.totalPaid
      .plus(bal.settledReceived)
      .minus(bal.totalOwed)
      .minus(bal.settledPaid);

    memberBalances.push({
      userId: member.userId,
      userName: member.user.name,
      avatarUrl: member.user.avatarUrl,
      totalPaid: bal.totalPaid.toFixed(2),
      totalOwed: bal.totalOwed.toFixed(2),
      totalSettledPaid: bal.settledPaid.toFixed(2),
      totalSettledReceived: bal.settledReceived.toFixed(2),
      netBalance: netBalance.toFixed(2),
    });
  }

  // 8. Calculate pairwise debts from net balances
    // 8. Build net balance map + person map for simplifier
  const netBalanceMap = new Map<string, Decimal>();
  const personMap = new Map<string, PersonInfo>();

  for (const member of members) {
    const bal = balanceMap.get(member.userId);
    if (!bal) continue;

    const netBalance = bal.totalPaid
      .plus(bal.settledReceived)
      .minus(bal.totalOwed)
      .minus(bal.settledPaid);

    netBalanceMap.set(member.userId, netBalance);
    personMap.set(member.userId, {
      userId: member.userId,
      name: member.user.name,
      avatarUrl: member.user.avatarUrl,
    });
  }

  // 9. Count naive debts (before simplification)
  const naiveCount = countNaiveDebts(
    expenses.map((e) => ({
      paidBy: e.paidBy,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        owedAmount: s.owedAmount,
      })),
    }))
  );

    // 10. Group currency already set above
  const currency = groupCurrency;

  // 11. Run debt simplification
  const simplification = simplifyWithStats(
    netBalanceMap,
    personMap,
    currency,
    naiveCount
  );

  return {
    groupId,
    currency,
    members: memberBalances,
    debts: simplification.debts,
    totalExpenses: totalExpenses.toFixed(2),
    expenseCount: expenses.length,
    simplificationStats: simplification.stats,
  };
}

// ─────────────────────────────────────────────
// Calculate pairwise debts
//
// Given net balances, find minimum set of transfers
// using a greedy algorithm:
//   - People with negative balance owe money
//   - People with positive balance are owed money
//   - Match biggest debtor with biggest creditor
// ─────────────────────────────────────────────

// function calculatePairwiseDebts(
//   members: MemberBalance[],
//   currency: string
// ): PairwiseDebt[] {
//   // Split into debtors (negative balance) and creditors (positive balance)
//   const debtors: { userId: string; name: string; avatarUrl: string | null; amount: Decimal }[] = [];
//   const creditors: { userId: string; name: string; avatarUrl: string | null; amount: Decimal }[] = [];

//   for (const member of members) {
//     const net = new Decimal(member.netBalance);
//     if (net.isNegative()) {
//       debtors.push({
//         userId: member.userId,
//         name: member.userName,
//         avatarUrl: member.avatarUrl,
//         amount: net.abs(),
//       });
//     } else if (net.isPositive()) {
//       creditors.push({
//         userId: member.userId,
//         name: member.userName,
//         avatarUrl: member.avatarUrl,
//         amount: net,
//       });
//     }
//   }

//   // Sort both descending by amount
//   debtors.sort((a, b) => b.amount.cmp(a.amount));
//   creditors.sort((a, b) => b.amount.cmp(a.amount));

//   // Greedy matching
//   const debts: PairwiseDebt[] = [];
//   let di = 0;
//   let ci = 0;

//   while (di < debtors.length && ci < creditors.length) {
//     const debtor = debtors[di];
//     const creditor = creditors[ci];

//     const transferAmount = Decimal.min(
//       debtor.amount,
//       creditor.amount
//     );

//     if (transferAmount.greaterThan(new Decimal("0.01"))) {
//       debts.push({
//         from: {
//           userId: debtor.userId,
//           name: debtor.name,
//           avatarUrl: debtor.avatarUrl,
//         },
//         to: {
//           userId: creditor.userId,
//           name: creditor.name,
//           avatarUrl: creditor.avatarUrl,
//         },
//         amount: transferAmount.toFixed(2),
//         currency,
//       });
//     }

//     debtor.amount = debtor.amount.minus(transferAmount);
//     creditor.amount = creditor.amount.minus(transferAmount);

//     if (debtor.amount.lessThanOrEqualTo(new Decimal("0.01"))) {
//       di++;
//     }
//     if (creditor.amount.lessThanOrEqualTo(new Decimal("0.01"))) {
//       ci++;
//     }
//   }

//   return debts;
// }

// ─────────────────────────────────────────────
// CALCULATE USER BALANCES (across all groups)
// ─────────────────────────────────────────────

export async function calculateUserBalances(userId: string) {
  // Get all groups the user belongs to
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          isArchived: true,
        },
      },
    },
  });

  const results = [];

  for (const membership of memberships) {
    if (membership.group.isArchived) continue;

    const groupBalances = await calculateGroupBalances(
      membership.groupId
    );

    const userBalance = groupBalances.members.find(
      (m) => m.userId === userId
    );

    if (userBalance) {
      results.push({
        groupId: membership.groupId,
        groupName: membership.group.name,
        balance: userBalance.netBalance,
        currency: groupBalances.currency,
      });
    }
  }

  

  return results;
}


// ─────────────────────────────────────────────
// SEND PAYMENT REMINDERS FOR ALL GROUPS
// Called by CRON daily
// ─────────────────────────────────────────────

// Minimum debt amount to trigger a reminder (in base currency units)
const REMINDER_THRESHOLD = 10;

// Don't remind more than once per 7 days for same debt
const REMINDER_COOLDOWN_DAYS = 7;
const REMINDER_COOLDOWN_SECONDS = REMINDER_COOLDOWN_DAYS * 24 * 60 * 60;

export async function sendPaymentReminders(): Promise<void> {
  // Get all non-archived groups
  const groups = await prisma.group.findMany({
    where: { isArchived: false },
    select: { id: true },
  });

  logger.info(
    `[Reminders] Checking ${groups.length} groups for outstanding debts`
  );

  let reminderCount = 0;

  for (const group of groups) {
    try {
      const balances = await calculateGroupBalances(group.id);

      for (const debt of balances.debts) {
        const amount = parseFloat(debt.amount);

        // Skip small debts
        if (amount < REMINDER_THRESHOLD) continue;

        // Check cooldown — don't spam
        const cooldownKey = `reminder:${debt.from.userId}:${debt.to.userId}:${group.id}`;
        const lastReminder = await cacheGet<string>(cooldownKey);

        if (lastReminder) {
          // Already reminded recently — skip
          continue;
        }

        // Queue reminder job
        await addPaymentReminderJob({
          groupId: group.id,
          debtorUserId: debt.from.userId,
          creditorUserId: debt.to.userId,
          amount,
          currency: debt.currency,
        });

        // Set cooldown in Redis
        await cacheSet(
          cooldownKey,
          new Date().toISOString(),
          REMINDER_COOLDOWN_SECONDS
        );

        reminderCount++;
      }
    } catch (err) {
      const error = err as Error;
      logger.error(
        `[Reminders] Error processing group ${group.id}:`,
        { message: error.message }
      );
    }
  }

  logger.info(
    `[Reminders] Sent ${reminderCount} payment reminder(s)`
  );
}