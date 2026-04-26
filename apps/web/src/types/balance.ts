// FILE: apps/web/src/types/balance.ts
// PURPOSE: TypeScript types for balance data across frontend
// DEPENDS ON: none
// LAST UPDATED: F17 - Debt Simplification Algorithm

export interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPaid: string;
  totalOwed: string;
  totalSettledPaid: string;
  totalSettledReceived: string;
  netBalance: string;
}

export interface PairwiseDebt {
  from: {
    userId: string;
    name: string;
    avatarUrl: string | null;
  };
  to: {
    userId: string;
    name: string;
    avatarUrl: string | null;
  };
  amount: string;
  currency: string;
}

export interface SimplificationStats {
  naiveCount: number;
  simplifiedCount: number;
  savings: number;
  savingsPercent: number;
}

export interface GroupBalanceResult {
  groupId: string;
  currency: string;
  members: MemberBalance[];
  debts: PairwiseDebt[];
  totalExpenses: string;
  expenseCount: number;
  simplificationStats: SimplificationStats;
}

export interface UserGroupBalance {
  groupId: string;
  groupName: string;
  balance: string;
  currency: string;
}