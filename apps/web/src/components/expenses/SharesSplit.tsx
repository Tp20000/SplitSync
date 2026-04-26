// FILE: apps/web/src/components/expenses/SharesSplit.tsx
// PURPOSE: Shares split — input number of shares per person
// DEPENDS ON: shadcn/ui Input
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials, stringToColor, formatCurrency } from "@/lib/utils";
import type { GroupMember } from "@/types/group";
import type { SplitEntry } from "@/types/expense";

interface Shares {
  [userId: string]: number;
}

interface SharesSplitProps {
  members: GroupMember[];
  shares: Shares;
  totalAmount: number;
  currency: string;
  onChange: (userId: string, value: number) => void;
}

export function SharesSplit({
  members,
  shares,
  totalAmount,
  currency,
  onChange,
}: SharesSplitProps) {
  const totalShares = Object.values(shares).reduce(
    (sum, val) => sum + val,
    0
  );

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Total shares: {totalShares}
        </span>
        {totalShares > 0 && (
          <span className="text-muted-foreground">
            1 share ={" "}
            {formatCurrency(totalAmount / totalShares, currency)}
          </span>
        )}
      </div>

      {/* Member inputs */}
      <div className="space-y-2">
        {members.map((member) => {
          const s = shares[member.userId] ?? 0;
          const amount =
            totalShares > 0
              ? (totalAmount * s) / totalShares
              : 0;

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
                {s > 0 ? formatCurrency(amount, currency) : "—"}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onChange(member.userId, Math.max(0, s - 1))
                  }
                  disabled={s <= 0}
                >
                  <Minus size={12} />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {s}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onChange(member.userId, s + 1)}
                >
                  <Plus size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildSharesSplits(shares: Shares): SplitEntry[] {
  return Object.entries(shares)
    .filter(([, val]) => val > 0)
    .map(([userId, val]) => ({
      userId,
      value: val,
    }));
}