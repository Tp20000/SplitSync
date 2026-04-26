// FILE: apps/web/src/components/expenses/ExpenseCardSkeleton.tsx
// PURPOSE: Loading skeleton for expense list items
// DEPENDS ON: none
// LAST UPDATED: F15 - Expense List + Detail UI

export function ExpenseCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 w-20 animate-pulse rounded bg-muted ml-auto" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted ml-auto" />
      </div>
    </div>
  );
}