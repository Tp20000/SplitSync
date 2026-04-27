// FILE: apps/web/src/components/charts/SummaryStats.tsx
// PURPOSE: Summary stat cards for analytics dashboard
// DEPENDS ON: useGroupSummary, shadcn/ui
// LAST UPDATED: F35 - Analytics Dashboard

"use client";

import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useGroupSummary } from "@/hooks/useAnalytics";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/expense";

interface SummaryStatsProps {
  groupId: string;
  currency?: string;
  className?: string;
}

export function SummaryStats({
  groupId,
  currency = "INR",
  className,
}: SummaryStatsProps) {
  const { data: summary, isLoading } = useGroupSummary(groupId);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const mom = summary.monthOverMonthChange;
  const momPositive = mom > 0;
  const momZero = mom === 0;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Expenses */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Total Expenses
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(summary.totalExpenses, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.expenseCount} expense
            {summary.expenseCount !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Avg Per Expense */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Avg Per Expense
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(summary.avgPerExpense, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            per transaction
          </p>
        </CardContent>
      </Card>

      {/* This Month */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            {momZero ? (
              <Minus size={14} className="text-muted-foreground" />
            ) : momPositive ? (
              <TrendingUp size={14} className="text-red-500" />
            ) : (
              <TrendingDown size={14} className="text-green-600" />
            )}
            <p className="text-xs text-muted-foreground">
              This Month
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(summary.thisMonthTotal, currency)}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              momZero
                ? "text-muted-foreground"
                : momPositive
                  ? "text-red-500"
                  : "text-green-600"
            )}
          >
            {momZero
              ? "No change"
              : `${momPositive ? "+" : ""}${mom}% vs last month`}
          </p>
        </CardContent>
      </Card>

      {/* Top Category */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Top Category
            </p>
          </div>
          <p className="text-2xl font-bold capitalize">
            {summary.topCategory
              ? getCategoryLabel(summary.topCategory as Category)
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.activeMembers} active member
            {summary.activeMembers !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}