// FILE: apps/web/src/components/balances/BalancesClient.tsx
// PURPOSE: Client component for balances page — handles all hooks + data
// DEPENDS ON: useUserBalances, GlobalBalanceSummary, GroupBalanceCard
// LAST UPDATED: F18 Fix - Server/Client split

"use client";

import { Separator } from "@/components/ui/separator";
import { GlobalBalanceSummary } from "./GlobalBalanceSummary";
import { GroupBalanceCard } from "./GroupBalanceCard";
import { useUserBalances } from "@/hooks/useBalances";

export function BalancesClient() {
  const { data: balances, isLoading } = useUserBalances();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Balances
        </h1>
        <p className="text-muted-foreground">
          See what you owe and what you are owed across all
          groups.
        </p>
      </div>

      {/* Global summary cards */}
      <GlobalBalanceSummary />

      <Separator />

      {/* Per-group breakdown */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">By Group</h3>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : !balances || balances.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">
              No balances yet — join a group and add expenses!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {balances.map((bal) => (
              <GroupBalanceCard key={bal.groupId} balance={bal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}