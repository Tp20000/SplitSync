// FILE: apps/web/src/types/expense.ts
// PURPOSE: TypeScript types for expenses across frontend
// DEPENDS ON: none
// LAST UPDATED: F14 - Expense Form UI

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export type Category =
  | "general"
  | "food"
  | "transport"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "rent"
  | "groceries"
  | "drinks"
  | "health"
  | "education"
  | "gifts"
  | "travel"
  | "other";

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  owedAmount: string;
  isSettled: boolean;
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl: string | null;
  };
}

export interface Expense {
  id: string;
  groupId: string;
  paidBy: string;
  title: string;
  description: string | null;
  totalAmount: string;
  currency: string;
  category: Category;
  splitType: SplitType;
  receiptUrl: string | null;
  expenseDate: string;
  isRecurring: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  paidByUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  splits: ExpenseSplit[];
  _count?: {
    comments: number;
    history?: number;
  };
}

export interface SplitEntry {
  userId: string;
  value?: number;
}

export interface CreateExpensePayload {
  title: string;
  description?: string;
  totalAmount: number;
  currency?: string;
  category: Category;
  splitType: SplitType;
  splits: SplitEntry[];
  paidBy?: string;
  expenseDate?: string;
}

export interface UpdateExpensePayload {
  title?: string;
  description?: string;
  totalAmount?: number;
  currency?: string;
  category?: Category;
  splitType?: SplitType;
  splits?: SplitEntry[];
  paidBy?: string;
  expenseDate?: string;
  version: number;
}

// ─────────────────────────────────────────────
// Expense History / Audit Trail
// ─────────────────────────────────────────────

export interface ExpenseHistoryEntry {
  id: string;
  expenseId: string;
  changedBy: string;
  action: "created" | "updated" | "deleted";
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}