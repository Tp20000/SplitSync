// FILE: apps/web/src/app/(dashboard)/dashboard/page.tsx
// PURPOSE: Dashboard home — summary + quick actions
// DEPENDS ON: authStore, useGroups, shadcn/ui
// LAST UPDATED: F11 - Groups Frontend

"use client";

import Link from "next/link";
import { Plus, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/stores/authStore";
import { useGroups } from "@/hooks/useGroups";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";
import { useUserBalances } from "@/hooks/useBalances";
import { useSocketEvent } from "@/hooks/useSocket";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Scale, TrendingUp, TrendingDown } from "lucide-react";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardPage() {
  const user = useUser();
  const { data: groups, isLoading } = useGroups();

    const { data: balances } = useUserBalances();

  // Calculate totals
  let totalOwe = 0;
  let totalGet = 0;
  if (balances) {
    for (const bal of balances) {
      const amount = parseFloat(bal.balance);
      if (amount > 0.01) totalGet += amount;
      else if (amount < -0.01) totalOwe += Math.abs(amount);
    }
  }

    const queryClient = useQueryClient();

  // Real-time: refresh balances when any group balance changes
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
  
  const netBalance = totalGet - totalOwe;

  const recentGroups = groups?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your groups.
        </p>
      </div>

            {/* Balance Summary */}
      {balances && balances.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingDown size={14} />
                You owe
              </div>
              <p className="text-2xl font-bold tabular-nums balance-negative">
                {formatCurrency(totalOwe, "INR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp size={14} />
                You are owed
              </div>
              <p className="text-2xl font-bold tabular-nums balance-positive">
                {formatCurrency(totalGet, "INR")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Scale size={14} />
                Net balance
              </div>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  netBalance > 0.01
                    ? "balance-positive"
                    : netBalance < -0.01
                      ? "balance-negative"
                      : "balance-zero"
                )}
              >
                {netBalance > 0 && "+"}
                {formatCurrency(Math.abs(netBalance), "INR")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <CreateGroupModal
          trigger={
            <Button className="gap-2">
              <Plus size={16} />
              New Group
            </Button>
          }
        />
        <JoinGroupModal />
      </div>

      {/* Recent Groups */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Groups</h2>
          <Link href="/groups">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
            >
              View all
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : recentGroups.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground" />
              <CardTitle className="mb-1 text-base">
                No groups yet
              </CardTitle>
              <CardDescription className="mb-4">
                Create your first group to start splitting expenses
              </CardDescription>
              <CreateGroupModal />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}