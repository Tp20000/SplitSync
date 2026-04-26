// FILE: apps/web/src/components/expenses/ExpenseList.tsx
// PURPOSE: Full expense list with filters, pagination, detail panel
// DEPENDS ON: ExpenseCard, ExpenseFilters, ExpenseDetail, useExpenses
// LAST UPDATED: F15 - Expense List + Detail UI

"use client";

import { useState } from "react";
import { Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseCard } from "./ExpenseCard";
import { ExpenseCardSkeleton } from "./ExpenseCardSkeleton";
import { ExpenseDetail } from "./ExpenseDetail";
import {
  ExpenseFilters,
  getDefaultFilters,
  type ExpenseFilterValues,
} from "./ExpenseFilters";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { useExpenses } from "@/hooks/useExpenses";
import type { GroupMember } from "@/types/group";
import type { Expense } from "@/types/expense";
import { useRealtimeExpenses } from "@/hooks/useRealtimeExpenses";

interface ExpenseListProps {
  groupId: string;
  members: GroupMember[];
}

export function ExpenseList({ groupId, members }: ExpenseListProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] =
    useState<ExpenseFilterValues>(getDefaultFilters());
  const [selectedExpense, setSelectedExpense] =
    useState<Expense | null>(null);

  const { data, isLoading, error } = useExpenses(groupId, {
    page,
    limit: 15,
    category: filters.category || undefined,
    paidBy: filters.paidBy || undefined,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
    // Real-time updates
  useRealtimeExpenses(groupId);

  const expenses = data?.expenses ?? [];
  const meta = data?.meta;

  // Reset page when filters change
  const handleFilterChange = (newFilters: ExpenseFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load expenses. Please try again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold">
            Expenses
            {meta && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({meta.total})
              </span>
            )}
          </h3>
          <CreateExpenseModal groupId={groupId} />
        </div>

        {/* Filters */}
        <ExpenseFilters
          members={members}
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <Receipt className="mb-3 h-10 w-10 text-muted-foreground" />
            <h4 className="text-lg font-semibold">No expenses found</h4>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              {filters.search || filters.category || filters.paidBy
                ? "Try adjusting your filters."
                : "Add your first expense to start splitting."}
            </p>
            {!filters.search &&
              !filters.category &&
              !filters.paidBy && (
                <CreateExpenseModal groupId={groupId} />
              )}
          </div>
        ) : (
          /* Expense cards */
          <div className="space-y-2">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onClick={() => setSelectedExpense(expense)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ·{" "}
              {meta.total} expenses
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!meta.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel overlay */}
      {selectedExpense && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedExpense(null)}
          />
          {/* Panel */}
          <ExpenseDetail
            expense={selectedExpense}
            groupId={groupId}
            onClose={() => setSelectedExpense(null)}
          />
        </>
      )}
    </>
  );
}