// FILE: apps/web/src/components/expenses/SplitSelector.tsx
// PURPOSE: Tabbed split type selector wrapping all split components
// DEPENDS ON: shadcn Tabs, all split components
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EqualSplit, buildEqualSplits } from "./EqualSplit";
import { ExactSplit, buildExactSplits } from "./ExactSplit";
import { PercentageSplit, buildPercentageSplits } from "./PercentageSplit";
import { SharesSplit, buildSharesSplits } from "./SharesSplit";
import type { GroupMember } from "@/types/group";
import type { SplitType, SplitEntry } from "@/types/expense";

// ─────────────────────────────────────────────
// Split state managed by parent
// ─────────────────────────────────────────────

export interface SplitState {
  type: SplitType;
  equalSelected: string[];
  exactAmounts: Record<string, string>;
  percentages: Record<string, string>;
  shares: Record<string, number>;
}

export function getInitialSplitState(
  members: GroupMember[]
): SplitState {
  const allIds = members.map((m) => m.userId);
  const defaultShares: Record<string, number> = {};
  members.forEach((m) => {
    defaultShares[m.userId] = 1;
  });

  return {
    type: "equal",
    equalSelected: allIds,
    exactAmounts: {},
    percentages: {},
    shares: defaultShares,
  };
}

export function buildSplitsFromState(
  state: SplitState
): SplitEntry[] {
  switch (state.type) {
    case "equal":
      return buildEqualSplits(state.equalSelected);
    case "exact":
      return buildExactSplits(state.exactAmounts);
    case "percentage":
      return buildPercentageSplits(state.percentages);
    case "shares":
      return buildSharesSplits(state.shares);
  }
}

export function validateSplitState(
  state: SplitState,
  totalAmount: number
): string | null {
  switch (state.type) {
    case "equal":
      if (state.equalSelected.length === 0) {
        return "Select at least one person";
      }
      return null;

    case "exact": {
      const entries = buildExactSplits(state.exactAmounts);
      if (entries.length === 0) return "Enter amounts for at least one person";
      const sum = entries.reduce((s, e) => s + (e.value ?? 0), 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        return `Amounts total ${sum.toFixed(2)} but expense is ${totalAmount.toFixed(2)}`;
      }
      return null;
    }

    case "percentage": {
      const entries = buildPercentageSplits(state.percentages);
      if (entries.length === 0) return "Enter percentages for at least one person";
      const sum = entries.reduce((s, e) => s + (e.value ?? 0), 0);
      if (Math.abs(sum - 100) > 0.1) {
        return `Percentages total ${sum.toFixed(1)}% — must equal 100%`;
      }
      return null;
    }

    case "shares": {
      const entries = buildSharesSplits(state.shares);
      if (entries.length === 0) return "Give at least one person a share";
      return null;
    }
  }
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface SplitSelectorProps {
  members: GroupMember[];
  totalAmount: number;
  currency: string;
  splitState: SplitState;
  onSplitStateChange: (state: SplitState) => void;
}

export function SplitSelector({
  members,
  totalAmount,
  currency,
  splitState,
  onSplitStateChange,
}: SplitSelectorProps) {
  const updateState = (partial: Partial<SplitState>) => {
    onSplitStateChange({ ...splitState, ...partial });
  };

  return (
    <Tabs
      value={splitState.type}
      onValueChange={(v) => updateState({ type: v as SplitType })}
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="equal">Equal</TabsTrigger>
        <TabsTrigger value="exact">Exact</TabsTrigger>
        <TabsTrigger value="percentage">%</TabsTrigger>
        <TabsTrigger value="shares">Shares</TabsTrigger>
      </TabsList>

      <TabsContent value="equal" className="mt-3">
        <EqualSplit
          members={members}
          selectedIds={splitState.equalSelected}
          totalAmount={totalAmount}
          currency={currency}
          onToggle={(userId) => {
            const current = splitState.equalSelected;
            const next = current.includes(userId)
              ? current.filter((id) => id !== userId)
              : [...current, userId];
            updateState({ equalSelected: next });
          }}
        />
      </TabsContent>

      <TabsContent value="exact" className="mt-3">
        <ExactSplit
          members={members}
          amounts={splitState.exactAmounts}
          totalAmount={totalAmount}
          currency={currency}
          onChange={(userId, value) => {
            updateState({
              exactAmounts: {
                ...splitState.exactAmounts,
                [userId]: value,
              },
            });
          }}
        />
      </TabsContent>

      <TabsContent value="percentage" className="mt-3">
        <PercentageSplit
          members={members}
          percentages={splitState.percentages}
          totalAmount={totalAmount}
          currency={currency}
          onChange={(userId, value) => {
            updateState({
              percentages: {
                ...splitState.percentages,
                [userId]: value,
              },
            });
          }}
        />
      </TabsContent>

      <TabsContent value="shares" className="mt-3">
        <SharesSplit
          members={members}
          shares={splitState.shares}
          totalAmount={totalAmount}
          currency={currency}
          onChange={(userId, value) => {
            updateState({
              shares: {
                ...splitState.shares,
                [userId]: value,
              },
            });
          }}
        />
      </TabsContent>
    </Tabs>
  );
}