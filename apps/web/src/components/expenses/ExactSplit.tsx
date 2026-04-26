// FILE: apps/web/src/components/expenses/ExactSplit.tsx
// PURPOSE: Exact split — input exact amount per person
// DEPENDS ON: shadcn/ui Input
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { Input } from "@/components/ui/input";
import { getInitials, stringToColor, formatCurrency } from "@/lib/utils";
import type { GroupMember } from "@/types/group";
import type { SplitEntry } from "@/types/expense";
import { cn } from "@/lib/utils";

interface ExactAmounts {
  [userId: string]: string; // string to avoid floating point in input
}

interface ExactSplitProps {
  members: GroupMember[];
  amounts: ExactAmounts;
  totalAmount: number;
  currency: string;
  onChange: (userId: string, value: string) => void;
}

export function ExactSplit({
  members,
  amounts,
  totalAmount,
  currency,
  onChange,
}: ExactSplitProps) {
  const currentSum = Object.values(amounts).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const remaining = totalAmount - currentSum;
  const isValid = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Total: {formatCurrency(totalAmount, currency)}
        </span>
        <span
          className={cn(
            "font-medium",
            isValid
              ? "text-green-600"
              : remaining > 0
                ? "text-amber-600"
                : "text-destructive"
          )}
        >
          {isValid
            ? "✓ Balanced"
            : remaining > 0
              ? `${formatCurrency(remaining, currency)} left`
              : `${formatCurrency(Math.abs(remaining), currency)} over`}
        </span>
      </div>

      {/* Member inputs */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: stringToColor(member.user.name),
              }}
            >
              {getInitials(member.user.name)}
            </div>
            <span className="flex-1 text-sm font-medium truncate">
              {member.user.name}
            </span>
            <div className="w-28">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-8 text-right tabular-nums"
                value={amounts[member.userId] ?? ""}
                onChange={(e) =>
                  onChange(member.userId, e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildExactSplits(amounts: ExactAmounts): SplitEntry[] {
  return Object.entries(amounts)
    .filter(([, val]) => parseFloat(val) > 0)
    .map(([userId, val]) => ({
      userId,
      value: parseFloat(val),
    }));
}