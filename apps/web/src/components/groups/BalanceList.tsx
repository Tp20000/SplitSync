// FILE: apps/web/src/components/groups/BalanceList.tsx
// PURPOSE: Full balance view — member balances + pairwise debts
// DEPENDS ON: BalanceCard, useGroupBalances, shadcn/ui
// LAST UPDATED: F16 - Balance Calculation Engine

"use client";

import {
  Scale,
  Receipt,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BalanceCard } from "./BalanceCard";
import { SettleSuggestions } from "./SettleSuggestions";
import { useGroupBalances } from "@/hooks/useBalances";
import { useUser } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

interface BalanceListProps {
  groupId: string;
}

export function BalanceList({ groupId }: BalanceListProps) {
  const currentUser = useUser();
    const { data, isLoading, error, dataUpdatedAt, isFetching } =
    useGroupBalances(groupId);

  // Track last update time
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    if (dataUpdatedAt) {
      const date = new Date(dataUpdatedAt);
      setLastUpdated(
        date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [dataUpdatedAt]);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6 text-center">
          <AlertCircle className="mx-auto mb-2 text-destructive" size={24} />
          <p className="text-sm text-destructive">
            Failed to load balances
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── No expenses yet ──
  if (data.expenseCount === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Scale
            className="mx-auto mb-3 text-muted-foreground"
            size={32}
          />
          <p className="font-medium">No balances yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add expenses to see balance calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allSettled = data.debts.length === 0;

  // Sort: current user first, then by absolute net balance desc
  const sortedMembers = [...data.members].sort((a, b) => {
    if (a.userId === currentUser?.id) return -1;
    if (b.userId === currentUser?.id) return 1;
    return (
      Math.abs(parseFloat(b.netBalance)) -
      Math.abs(parseFloat(a.netBalance))
    );
  });

  return (
    <div className="space-y-6">
      {/* Last updated indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {lastUpdated && `Last updated: ${lastUpdated}`}
        </span>
        {isFetching && (
          <span className="flex items-center gap-1">
            <RefreshCw size={10} className="animate-spin" />
            Updating...
          </span>
        )}
      </div>
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Total Expenses
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(data.totalExpenses, data.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.expenseCount}{" "}
              {data.expenseCount === 1 ? "expense" : "expenses"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Pending Transfers
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.debts.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {allSettled
                ? "All settled up!"
                : `${data.debts.length} payment${data.debts.length !== 1 ? "s" : ""} needed`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {allSettled ? (
                <CheckCircle2
                  size={16}
                  className="text-green-600"
                />
              ) : (
                <AlertCircle
                  size={16}
                  className="text-amber-600"
                />
              )}
              <p className="text-sm text-muted-foreground">
                Status
              </p>
            </div>
            <p
              className={cn(
                "mt-1 text-2xl font-bold",
                allSettled ? "text-green-600" : "text-amber-600"
              )}
            >
              {allSettled ? "Settled" : "Pending"}
            </p>
            <p className="text-xs text-muted-foreground">
              {allSettled
                ? "No outstanding balances"
                : "Some members owe others"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Member Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Balances</CardTitle>
          <CardDescription>
            Positive = gets back money · Negative = owes money
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedMembers.map((member) => (
            <BalanceCard
              key={member.userId}
              member={member}
              currency={data.currency}
              currentUserId={currentUser?.id ?? ""}
            />
          ))}
        </CardContent>
      </Card>

      {/* Settlement Suggestions */}
      <SettleSuggestions
        debts={data.debts}
        stats={data.simplificationStats ?? {
          naiveCount: 0,
          simplifiedCount: 0,
          savings: 0,
          savingsPercent: 0,
        }}
        currency={data.currency}
        groupId={groupId}
      />
    </div>
  );
}