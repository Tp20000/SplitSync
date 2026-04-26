// FILE: apps/web/src/types/analytics.ts
// PURPOSE: TypeScript types for analytics data
// DEPENDS ON: none
// LAST UPDATED: F35 - Analytics Dashboard

export interface GroupSummary {
  totalExpenses: string;
  expenseCount: number;
  avgPerExpense: string;
  activeMembers: number;
  topCategory: string | null;
  thisMonthTotal: string;
  lastMonthTotal: string;
  monthOverMonthChange: number;
}

export interface TrendDataPoint {
  key: string;
  label: string;
  total: number;
  count: number;
}

export interface CategoryDataPoint {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MemberSpendingData {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPaid: number;
  totalOwed: number;
  expenseCount: number;
}

export interface CategoryBreakdown {
  breakdown: CategoryDataPoint[];
  grandTotal: number;
}