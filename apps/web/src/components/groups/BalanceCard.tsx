// FILE: apps/web/src/components/groups/BalanceCard.tsx
// PURPOSE: Shows a single member's balance in the group
// DEPENDS ON: shadcn/ui, balance types
// LAST UPDATED: F16 - Balance Calculation Engine

"use client";

import {
  getInitials,
  stringToColor,
  formatCurrency,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MemberBalance } from "@/types/balance";

interface BalanceCardProps {
  member: MemberBalance;
  currency: string;
  currentUserId: string;
}

export function BalanceCard({
  member,
  currency,
  currentUserId,
}: BalanceCardProps) {
  const net = parseFloat(member.netBalance);
  const isCurrentUser = member.userId === currentUserId;
  const isPositive = net > 0.01;
  const isNegative = net < -0.01;
  const isZero = !isPositive && !isNegative;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-4 transition-colors",
        isCurrentUser && "bg-primary/5 border-primary/20"
      )}
    >
      {/* Left — avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{
            backgroundColor: stringToColor(member.userName),
          }}
        >
          {getInitials(member.userName)}
        </div>
        <div>
          <p className="text-sm font-medium">
            {member.userName}
            {isCurrentUser && (
              <span className="text-xs text-muted-foreground ml-1">
                (you)
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Paid {formatCurrency(member.totalPaid, currency)} ·
            Owes {formatCurrency(member.totalOwed, currency)}
          </p>
        </div>
      </div>

      {/* Right — net balance */}
      <div className="flex items-center gap-2 text-right">
        {isPositive && (
          <TrendingUp size={16} className="text-green-600" />
        )}
        {isNegative && (
          <TrendingDown size={16} className="text-red-600" />
        )}
        {isZero && (
          <Minus size={16} className="text-muted-foreground" />
        )}

        <div>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isPositive && "balance-positive",
              isNegative && "balance-negative",
              isZero && "balance-zero"
            )}
          >
            {isPositive && "+"}
            {formatCurrency(Math.abs(net), currency)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isPositive
              ? "gets back"
              : isNegative
                ? "owes"
                : "settled up"}
          </p>
        </div>
      </div>
    </div>
  );
}