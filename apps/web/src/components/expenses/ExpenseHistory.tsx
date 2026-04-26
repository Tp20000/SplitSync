// FILE: apps/web/src/components/expenses/ExpenseHistory.tsx
// PURPOSE: Visual timeline of expense changes — audit trail
// DEPENDS ON: useExpenseHistory, shadcn/ui
// LAST UPDATED: F26 - Expense Edit History

"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useExpenseHistory } from "@/hooks/useExpenses";
import {
  formatDate,
  formatRelativeTime,
  getInitials,
  stringToColor,
  formatCurrency,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ExpenseHistoryEntry } from "@/types/expense";

interface ExpenseHistoryProps {
  groupId: string;
  expenseId: string;
  currency: string;
}

export function ExpenseHistory({
  groupId,
  expenseId,
  currency,
}: ExpenseHistoryProps) {
  const { data: history, isLoading } = useExpenseHistory(
    groupId,
    expenseId
  );

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex gap-3"
          >
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No history available
      </p>
    );
  }

  return (
    <div className="space-y-1 pt-2">
      {history.map((entry, index) => (
        <HistoryEntry
          key={entry.id}
          entry={entry}
          currency={currency}
          isLast={index === history.length - 1}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Single history entry
// ─────────────────────────────────────────────

function HistoryEntry({
  entry,
  currency,
  isLast,
}: {
  entry: ExpenseHistoryEntry;
  currency: string;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const actionConfig = {
    created: {
      icon: Plus,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Created",
    },
    updated: {
      icon: Pencil,
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "Updated",
    },
    deleted: {
      icon: Trash2,
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Deleted",
    },
  }[entry.action];

  const Icon = actionConfig.icon;

  // Compute changes between old and new data
  const changes =
    entry.action === "updated" && entry.oldData && entry.newData
      ? computeChanges(entry.oldData, entry.newData, currency)
      : [];

  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            actionConfig.bg
          )}
        >
          <Icon size={14} className={actionConfig.color} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-border my-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{
                backgroundColor: stringToColor(
                  entry.user.name
                ),
              }}
            >
              {getInitials(entry.user.name)}
            </div>
            <span className="text-sm font-medium">
              {entry.user.name}
            </span>
            <Badge
              variant={
                entry.action === "created"
                  ? "success"
                  : entry.action === "deleted"
                    ? "destructive"
                    : "secondary"
              }
              className="text-[10px] h-4"
            >
              {actionConfig.label}
            </Badge>
          </div>
          <span
            className="text-[10px] text-muted-foreground shrink-0"
            title={formatDate(entry.changedAt)}
          >
            {formatRelativeTime(entry.changedAt)}
          </span>
        </div>

        {/* Summary for created/deleted */}
        {entry.action === "created" && entry.newData && (
          <p className="mt-1 text-xs text-muted-foreground">
            Added &quot;{(entry.newData as Record<string, unknown>).title as string}&quot;
            {(entry.newData as Record<string, unknown>).totalAmount && (
              <> for {formatCurrency(
                String((entry.newData as Record<string, unknown>).totalAmount),
                currency
              )}</>
            )}
          </p>
        )}

        {entry.action === "deleted" && entry.oldData && (
          <p className="mt-1 text-xs text-muted-foreground">
            Removed &quot;{(entry.oldData as Record<string, unknown>).title as string}&quot;
          </p>
        )}

        {/* Changes for updated — expandable */}
        {entry.action === "updated" && changes.length > 0 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              {changes.length} field{changes.length !== 1 ? "s" : ""} changed
            </button>

            {expanded && (
              <div className="mt-2 space-y-1.5 rounded-lg bg-muted/50 p-3">
                {changes.map((change, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-medium text-muted-foreground">
                      {change.field}:
                    </span>{" "}
                    <span className="line-through text-red-600/70">
                      {change.oldValue}
                    </span>{" "}
                    <span className="text-foreground">→</span>{" "}
                    <span className="text-green-600 font-medium">
                      {change.newValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Updated but no diff available */}
        {entry.action === "updated" && changes.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Expense details were modified
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Compute human-readable changes between old/new
// ─────────────────────────────────────────────

interface Change {
  field: string;
  oldValue: string;
  newValue: string;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  totalAmount: "Amount",
  splitType: "Split type",
  paidBy: "Paid by",
  category: "Category",
  description: "Description",
  currency: "Currency",
};

function computeChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  currency: string
): Change[] {
  const changes: Change[] = [];

  const fieldsToCompare = [
    "title",
    "totalAmount",
    "splitType",
    "paidBy",
    "category",
    "description",
    "currency",
  ];

  for (const field of fieldsToCompare) {
    const oldVal = oldData[field];
    const newVal = newData[field];

    if (oldVal === undefined && newVal === undefined) continue;
    if (String(oldVal) === String(newVal)) continue;

    const label = FIELD_LABELS[field] ?? field;

    let oldDisplay = String(oldVal ?? "—");
    let newDisplay = String(newVal ?? "—");

    // Format amounts
    if (field === "totalAmount") {
      oldDisplay = oldVal
        ? formatCurrency(String(oldVal), currency)
        : "—";
      newDisplay = newVal
        ? formatCurrency(String(newVal), currency)
        : "—";
    }

    // Format split type
    if (field === "splitType") {
      const typeLabels: Record<string, string> = {
        equal: "Equal",
        exact: "Exact",
        percentage: "Percentage",
        shares: "Shares",
      };
      oldDisplay = typeLabels[String(oldVal)] ?? String(oldVal);
      newDisplay = typeLabels[String(newVal)] ?? String(newVal);
    }

    changes.push({
      field: label,
      oldValue: oldDisplay,
      newValue: newDisplay,
    });
  }

  // Check if splits changed
  const oldSplits = oldData.splits as
    | Array<{ userId: string; owedAmount: string }>
    | undefined;
  const newSplits = newData.splits as
    | Array<{ userId: string; owedAmount: string }>
    | undefined;

  if (oldSplits && newSplits) {
    const oldSplitStr = oldSplits
      .map((s) => `${s.userId}:${s.owedAmount}`)
      .sort()
      .join(",");
    const newSplitStr = newSplits
      .map((s) => `${s.userId}:${s.owedAmount}`)
      .sort()
      .join(",");

    if (oldSplitStr !== newSplitStr) {
      changes.push({
        field: "Split amounts",
        oldValue: `${oldSplits.length} splits`,
        newValue: `${newSplits.length} splits (modified)`,
      });
    }
  }

  return changes;
}