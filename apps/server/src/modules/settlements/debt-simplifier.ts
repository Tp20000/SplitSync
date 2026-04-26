// FILE: apps/server/src/modules/settlements/debt-simplifier.ts
// PURPOSE: Graph-based debt simplification — minimizes number of transactions
// DEPENDS ON: decimal.js
// LAST UPDATED: F17 - Debt Simplification Algorithm

import Decimal from "decimal.js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DebtEdge {
  from: string;   // userId who owes
  to: string;     // userId who is owed
  amount: Decimal;
}

export interface PersonInfo {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface SimplifiedDebt {
  from: PersonInfo;
  to: PersonInfo;
  amount: string;
  currency: string;
}

// ─────────────────────────────────────────────
// DEBT SIMPLIFICATION ALGORITHM
//
// Given a set of net balances (positive = owed, negative = owes),
// find the minimum set of transactions to settle all debts.
//
// Algorithm (Min-Cash-Flow):
// 1. Calculate net balance for each person
// 2. Separate into creditors (positive) and debtors (negative)
// 3. Sort both lists by absolute amount (descending)
// 4. Match largest debtor with largest creditor
// 5. Transfer min(debt, credit)
// 6. Adjust remaining balances
// 7. Repeat until all settled
//
// This is optimal for most real-world cases.
// For N people, produces at most N-1 transactions
// (vs potentially N*(N-1)/2 without simplification).
// ─────────────────────────────────────────────

export function simplifyDebts(
  netBalances: Map<string, Decimal>,
  personMap: Map<string, PersonInfo>,
  currency: string
): SimplifiedDebt[] {
  // Threshold: ignore amounts less than 1 cent
  const THRESHOLD = new Decimal("0.01");

  // Separate into creditors and debtors
  const creditors: { userId: string; amount: Decimal }[] = [];
  const debtors: { userId: string; amount: Decimal }[] = [];

  for (const [userId, balance] of netBalances.entries()) {
    if (balance.greaterThan(THRESHOLD)) {
      creditors.push({ userId, amount: balance });
    } else if (balance.lessThan(THRESHOLD.neg())) {
      debtors.push({ userId, amount: balance.abs() });
    }
  }

  // Sort descending by amount (largest first)
  creditors.sort((a, b) => b.amount.cmp(a.amount));
  debtors.sort((a, b) => b.amount.cmp(a.amount));

  // Match debtors with creditors
  const result: SimplifiedDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    // Transfer the minimum of what debtor owes and creditor is owed
    const transferAmount = Decimal.min(
      debtor.amount,
      creditor.amount
    );

    if (transferAmount.greaterThan(THRESHOLD)) {
      const fromPerson = personMap.get(debtor.userId);
      const toPerson = personMap.get(creditor.userId);

      if (fromPerson && toPerson) {
        result.push({
          from: fromPerson,
          to: toPerson,
          amount: transferAmount.toFixed(2),
          currency,
        });
      }
    }

    // Update remaining balances
    debtor.amount = debtor.amount.minus(transferAmount);
    creditor.amount = creditor.amount.minus(transferAmount);

    // Move pointers if fully settled
    if (debtor.amount.lessThanOrEqualTo(THRESHOLD)) {
      di++;
    }
    if (creditor.amount.lessThanOrEqualTo(THRESHOLD)) {
      ci++;
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// COUNT NAIVE (unsimplified) DEBTS
//
// Counts how many pairwise debts exist if we track
// every expense split individually (no netting).
// Used to show "before vs after" optimization stats.
// ─────────────────────────────────────────────

export function countNaiveDebts(
  expenses: Array<{
    paidBy: string;
    splits: Array<{
      userId: string;
      owedAmount: Decimal | { toString: () => string } | string;
    }>;
  }>
): number {
  // Track pairwise debts: "from:to" → total
  const pairwise = new Map<string, Decimal>();

  for (const expense of expenses) {
    for (const split of expense.splits) {
      // Skip if the split is for the payer themselves
      if (split.userId === expense.paidBy) continue;

      const amount =
        split.owedAmount instanceof Decimal
          ? split.owedAmount
          : new Decimal(split.owedAmount.toString());

      if (amount.lessThanOrEqualTo(0)) continue;

      const key = `${split.userId}:${expense.paidBy}`;
      const existing = pairwise.get(key) ?? new Decimal(0);
      pairwise.set(key, existing.plus(amount));
    }
  }

  // Net out opposing debts
  const netted = new Map<string, Decimal>();

  for (const [key, amount] of pairwise.entries()) {
    const [from, to] = key.split(":");
    const reverseKey = `${to}:${from}`;
    const reverseAmount = pairwise.get(reverseKey) ?? new Decimal(0);

    const net = amount.minus(reverseAmount);

    if (net.greaterThan(new Decimal("0.01"))) {
      netted.set(key, net);
    }
  }

  return netted.size;
}

// ─────────────────────────────────────────────
// FULL SIMPLIFICATION WITH STATS
//
// Returns simplified debts + optimization stats
// ─────────────────────────────────────────────

export interface SimplificationResult {
  debts: SimplifiedDebt[];
  stats: {
    naiveCount: number;       // debts without simplification
    simplifiedCount: number;  // debts after simplification
    savings: number;          // how many transfers saved
    savingsPercent: number;   // percentage saved
  };
}

export function simplifyWithStats(
  netBalances: Map<string, Decimal>,
  personMap: Map<string, PersonInfo>,
  currency: string,
  naiveCount: number
): SimplificationResult {
  const debts = simplifyDebts(netBalances, personMap, currency);
  const simplifiedCount = debts.length;
  const savings = Math.max(0, naiveCount - simplifiedCount);
  const savingsPercent =
    naiveCount > 0
      ? Math.round((savings / naiveCount) * 100)
      : 0;

  return {
    debts,
    stats: {
      naiveCount,
      simplifiedCount,
      savings,
      savingsPercent,
    },
  };
}