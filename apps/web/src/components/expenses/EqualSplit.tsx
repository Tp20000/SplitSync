// FILE: apps/web/src/components/expenses/EqualSplit.tsx
// PURPOSE: Equal split — checkboxes to include/exclude members
// DEPENDS ON: shadcn/ui, group member types
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { Check } from "lucide-react";
import { getInitials, stringToColor, formatCurrency } from "@/lib/utils";
import type { GroupMember } from "@/types/group";
import type { SplitEntry } from "@/types/expense";
import { cn } from "@/lib/utils";

interface EqualSplitProps {
  members: GroupMember[];
  selectedIds: string[];
  totalAmount: number;
  currency: string;
  onToggle: (userId: string) => void;
}

export function EqualSplit({
  members,
  selectedIds,
  totalAmount,
  currency,
  onToggle,
}: EqualSplitProps) {
  const perPerson =
    selectedIds.length > 0 ? totalAmount / selectedIds.length : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Split equally among {selectedIds.length} people
        </span>
        {selectedIds.length > 0 && (
          <span className="font-medium">
            {formatCurrency(perPerson, currency)} each
          </span>
        )}
      </div>

      <div className="space-y-1">
        {members.map((member) => {
          const isSelected = selectedIds.includes(member.userId);

          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => onToggle(member.userId)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: stringToColor(
                      member.user.name
                    ),
                  }}
                >
                  {getInitials(member.user.name)}
                </div>
                <span className="text-sm font-medium">
                  {member.user.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isSelected && (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(perPerson, currency)}
                  </span>
                )}
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check size={12} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function buildEqualSplits(selectedIds: string[]): SplitEntry[] {
  return selectedIds.map((userId) => ({ userId }));
}