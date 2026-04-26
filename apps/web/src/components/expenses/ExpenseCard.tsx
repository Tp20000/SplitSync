// FILE: apps/web/src/components/expenses/ExpenseCard.tsx
// PURPOSE: Single expense row in the expense list
// DEPENDS ON: shadcn/ui, expense types, CategoryPicker icons
// LAST UPDATED: F15 - Expense List + Detail UI

"use client";

import { MessageSquare, FileImage } from "lucide-react";
import { getCategoryIcon, getCategoryLabel } from "./CategoryPicker";
import {
  formatCurrency,
  formatRelativeTime,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { useUser } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/expense";

interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
}

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const currentUser = useUser();
  const CategoryIcon = getCategoryIcon(expense.category);
  const isPayer = expense.paidBy === currentUser?.id;

  // Find what current user owes
  const userSplit = expense.splits.find(
    (s) => s.userId === currentUser?.id
  );
  const userOwed = userSplit
    ? parseFloat(userSplit.owedAmount)
    : 0;

  // Net for current user: positive = others owe you, negative = you owe
  const totalAmount = parseFloat(expense.totalAmount);
  const netAmount = isPayer
    ? totalAmount - userOwed // you paid, so others owe you this much
    : -userOwed; // you didn't pay, so you owe this much

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm hover:border-primary/20 hover:-translate-y-px"
    >
      {/* Category icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <CategoryIcon size={18} className="text-muted-foreground" />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {expense.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Paid by */}
          <div className="flex items-center gap-1">
            <div
              className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{
                backgroundColor: stringToColor(
                  expense.paidByUser.name
                ),
              }}
            >
              {getInitials(expense.paidByUser.name)}
            </div>
            <span className="text-xs text-muted-foreground">
              {isPayer ? "You paid" : `${expense.paidByUser.name.split(" ")[0]} paid`}
            </span>
          </div>

          {/* Category label */}
          <span className="text-xs text-muted-foreground">
            · {getCategoryLabel(expense.category)}
          </span>

          {/* Receipt indicator */}
          {expense.receiptUrl && (
            <span
              className="flex items-center gap-0.5 text-xs text-green-600"
              title="Has receipt"
            >
              <FileImage size={10} />
            </span>
          )}

          {/* Comments count */}
          {expense._count?.comments !== undefined &&
            expense._count.comments > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <MessageSquare size={10} />
                {expense._count.comments}
              </span>
            )}
        </div>
      </div>

      {/* Amount + date */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(totalAmount, expense.currency)}
          </p>
          {expense.currency !== "INR" && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1 rounded">
              {expense.currency}
            </span>
          )}

        {/* Net amount for current user */}
        {currentUser && (
          <p
            className={cn(
              "text-xs tabular-nums mt-0.5",
              netAmount > 0
                ? "balance-positive"
                : netAmount < 0
                  ? "balance-negative"
                  : "balance-zero"
            )}
          >
            {netAmount > 0
              ? `you get ${formatCurrency(netAmount, expense.currency)}`
              : netAmount < 0
                ? `you owe ${formatCurrency(Math.abs(netAmount), expense.currency)}`
                : "settled"}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatRelativeTime(expense.expenseDate)}
        </p>
      </div>
    </button>
  );
}