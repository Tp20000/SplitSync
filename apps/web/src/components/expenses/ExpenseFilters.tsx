// FILE: apps/web/src/components/expenses/ExpenseFilters.tsx
// PURPOSE: Filter bar for expense list — category, paidBy, search
// DEPENDS ON: shadcn/ui, group members
// LAST UPDATED: F15 - Expense List + Detail UI

"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/validations/expense";
import { getCategoryLabel } from "./CategoryPicker";
import type { GroupMember } from "@/types/group";

export interface ExpenseFilterValues {
  search: string;
  category: string;
  paidBy: string;
  sortBy: string;
  sortOrder: string;
}

interface ExpenseFiltersProps {
  members: GroupMember[];
  filters: ExpenseFilterValues;
  onChange: (filters: ExpenseFilterValues) => void;
}

export function ExpenseFilters({
  members,
  filters,
  onChange,
}: ExpenseFiltersProps) {
  const hasFilters =
    filters.search ||
    filters.category ||
    filters.paidBy;

  const updateFilter = (
    key: keyof ExpenseFilterValues,
    value: string
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      search: "",
      category: "",
      paidBy: "",
      sortBy: "expenseDate",
      sortOrder: "desc",
    });
  };

  return (
    <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {/* Search */}
        <div className="relative min-w-[140px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search expenses..."
            className="pl-9 h-9"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Category filter */}
        <Select
          value={filters.category || "all"}
          onValueChange={(v) =>
            updateFilter("category", v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-32 shrink-0 h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Paid by filter */}
        <Select
          value={filters.paidBy || "all"}
          onValueChange={(v) =>
            updateFilter("paidBy", v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-32 shrink-0 h-9">
            <SelectValue placeholder="Paid by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}:${filters.sortOrder}`}
          onValueChange={(v) => {
            const [sortBy, sortOrder] = v.split(":");
            onChange({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="w-32 shrink-0 h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expenseDate:desc">
              Newest first
            </SelectItem>
            <SelectItem value="expenseDate:asc">
              Oldest first
            </SelectItem>
            <SelectItem value="totalAmount:desc">
              Highest amount
            </SelectItem>
            <SelectItem value="totalAmount:asc">
              Lowest amount
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filter indicator */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Filters active
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={clearFilters}
          >
            <X size={12} />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export function getDefaultFilters(): ExpenseFilterValues {
  return {
    search: "",
    category: "",
    paidBy: "",
    sortBy: "expenseDate",
    sortOrder: "desc",
  };
}