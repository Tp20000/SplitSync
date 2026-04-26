// FILE: apps/web/src/components/expenses/PercentageSplit.tsx
// PURPOSE: Percentage split — input % per person (must sum to 100)
// DEPENDS ON: shadcn/ui Input
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { Input } from "@/components/ui/input";
import { getInitials, stringToColor, formatCurrency } from "@/lib/utils";
import type { GroupMember } from "@/types/group";
import type { SplitEntry } from "@/types/expense";
import { cn } from "@/lib/utils";

interface Percentages {
  [userId: string]: string;
}

interface PercentageSplitProps {
  members: GroupMember[];
  percentages: Percentages;
  totalAmount: number;
  currency: string;
  onChange: (userId: string, value: string) => void;
}

export function PercentageSplit({
  members,
  percentages,
  totalAmount,
  currency,
  onChange,
}: PercentageSplitProps) {
  const currentSum = Object.values(percentages).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const remaining = 100 - currentSum;
  const isValid = Math.abs(remaining) < 0.01;

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Total must equal 100%
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
            ? "✓ 100%"
            : remaining > 0
              ? `${remaining.toFixed(1)}% remaining`
              : `${Math.abs(remaining).toFixed(1)}% over`}
        </span>
      </div>

      {/* Member inputs */}
      <div className="space-y-2">
        {members.map((member) => {
          const pct = parseFloat(percentages[member.userId] ?? "0");
          const amount = (totalAmount * pct) / 100;

          return (
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
              <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                {pct > 0 ? formatCurrency(amount, currency) : "—"}
              </span>
              <div className="flex items-center gap-1 w-20">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="0"
                  className="h-8 text-right tabular-nums"
                  value={percentages[member.userId] ?? ""}
                  onChange={(e) =>
                    onChange(member.userId, e.target.value)
                  }
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildPercentageSplits(
  percentages: Percentages
): SplitEntry[] {
  return Object.entries(percentages)
    .filter(([, val]) => parseFloat(val) > 0)
    .map(([userId, val]) => ({
      userId,
      value: parseFloat(val),
    }));
}