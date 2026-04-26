// FILE: apps/web/src/types/settlement.ts
// PURPOSE: TypeScript types for settlements
// DEPENDS ON: none
// LAST UPDATED: F25 - Settlement Recording API

export interface Settlement {
  id: string;
  groupId: string;
  paidBy: string;
  paidTo: string;
  amount: string;
  currency: string;
  note: string | null;
  settledAt: string;
  createdAt: string;
  paidByUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  paidToUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface CreateSettlementPayload {
  paidTo: string;
  amount: number;
  currency?: string;
  note?: string;
}