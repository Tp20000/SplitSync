// FILE: apps/web/src/types/recurring.ts
// PURPOSE: TypeScript types for recurring expenses
// DEPENDS ON: none
// LAST UPDATED: F31 - Recurring Expenses Engine

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  id: string;
  groupId: string;
  createdBy: string;
  frequency: Frequency;
  nextRunAt: string;
  lastRunAt: string | null;
  isActive: boolean;
  createdAt: string;
  templateData: {
    title: string;
    description?: string;
    totalAmount: number;
    currency: string;
    category: string;
    splitType: string;
    splits: Array<{ userId: string; value?: number }>;
    paidBy: string;
  };
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}