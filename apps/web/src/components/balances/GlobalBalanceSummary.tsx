// FILE: apps/web/src/components/balances/GlobalBalanceSummary.tsx
// PURPOSE: Shows total net balance across all groups
// DEPENDS ON: useUserBalances
// LAST UPDATED: F18 - Balances Page + Settle UI

"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserBalances } from "@/hooks/useBalances";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "@/hooks/useSocket";

export function GlobalBalanceSummary() {
  const { data: balances, isLoading } = useUserBalances();

    const queryClient = useQueryClient();

  // Listen for balance updates from ANY group
  useSocketEvent(
    "balance:updated",
    useCallback(
      () => {
        void queryClient.invalidateQueries({
          queryKey: ["user", "balances"],
        });
      },
      [queryClient]
    )
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return null;
  }

  let totalOwe = 0;
  let totalGet = 0;

  for (const bal of balances) {
    const amount = parseFloat(bal.balance);
    if (amount > 0.01) {
      totalGet += amount;
    } else if (amount < -0.01) {
      totalOwe += Math.abs(amount);
    }
  }

  const net = totalGet - totalOwe;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Total you owe
          </p>
          <p className="text-2xl font-bold tabular-nums balance-negative">
            {formatCurrency(totalOwe, "INR")}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <ArrowUpRight size={12} />
            Money you need to pay others
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Total you are owed
          </p>
          <p className="text-2xl font-bold tabular-nums balance-positive">
            {formatCurrency(totalGet, "INR")}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <ArrowDownRight size={12} />
            Money others need to pay you
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">
            Net Balance
          </p>
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              net > 0.01
                ? "balance-positive"
                : net < -0.01
                  ? "balance-negative"
                  : "balance-zero"
            )}
          >
            {net > 0 && "+"}
            {formatCurrency(Math.abs(net), "INR")}
          </p>
          <div className="text-xs text-muted-foreground mt-1">
            {net > 0.01
              ? "Overall you are up"
              : net < -0.01
                ? "Overall you are down"
                : "You are completely even"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}