// FILE: apps/web/src/components/balances/GroupBalanceCard.tsx
// PURPOSE: Card showing balance for a single group on global balances page
// DEPENDS ON: shadcn/ui
// LAST UPDATED: F18 - Balances Page + Settle UI

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserGroupBalance } from "@/types/balance";

interface GroupBalanceCardProps {
  balance: UserGroupBalance;
}

export function GroupBalanceCard({ balance }: GroupBalanceCardProps) {
  const amount = parseFloat(balance.balance);
  const isPositive = amount > 0.01;
  const isNegative = amount < -0.01;
  const isZero = !isPositive && !isNegative;

  return (
    <Card className="transition-all hover:shadow-sm hover:border-primary/20">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">{balance.groupName}</p>
          <p
            className={cn(
              "text-lg font-bold tabular-nums mt-1",
              isPositive && "balance-positive",
              isNegative && "balance-negative",
              isZero && "balance-zero"
            )}
          >
            {isPositive && "+"}
            {formatCurrency(Math.abs(amount), balance.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPositive
              ? "they owe you"
              : isNegative
                ? "you owe them"
                : "all settled up"}
          </p>
        </div>

        <Link href={`/groups/${balance.groupId}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            Details
            <ArrowRight size={14} />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}