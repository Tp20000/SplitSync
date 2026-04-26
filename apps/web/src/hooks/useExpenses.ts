// FILE: apps/web/src/hooks/useExpenses.ts
// PURPOSE: TanStack Query hooks for expense API operations
// DEPENDS ON: @tanstack/react-query, apiClient, expense types
// LAST UPDATED: F14 - Expense Form UI

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { groupKeys } from "@/hooks/useGroups";
import type {
  Expense,
  CreateExpensePayload,
  UpdateExpensePayload,
  ExpenseHistoryEntry,
} from "@/types/expense";
import type { ApiSuccess } from "@/types/auth";

// ─────────────────────────────────────────────
// Query keys
// ─────────────────────────────────────────────

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (groupId: string) =>
    [...expenseKeys.all, "list", groupId] as const,
  listFiltered: (groupId: string, filters: Record<string, string>) =>
    [...expenseKeys.all, "list", groupId, filters] as const,
  detail: (groupId: string, expenseId: string) =>
    [...expenseKeys.all, "detail", groupId, expenseId] as const,
  history: (groupId: string, expenseId: string) =>
    [...expenseKeys.all, "history", groupId, expenseId] as const,
};

// ─────────────────────────────────────────────
// Pagination meta type
// ─────────────────────────────────────────────

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─────────────────────────────────────────────
// GET expenses list (paginated)
// ─────────────────────────────────────────────

export function useExpenses(
  groupId: string,
  filters: {
    page?: number;
    limit?: number;
    category?: string;
    paidBy?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.category) params.set("category", filters.category);
  if (filters.paidBy) params.set("paidBy", filters.paidBy);
  if (filters.search) params.set("search", filters.search);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const filterKey = Object.fromEntries(params.entries());

  return useQuery({
    queryKey: expenseKeys.listFiltered(groupId, filterKey),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: true;
        data: Expense[];
        meta: PaginationMeta;
      }>(`/groups/${groupId}/expenses?${params.toString()}`);
      return {
        expenses: response.data.data,
        meta: response.data.meta,
      };
    },
    enabled: !!groupId,
    staleTime: 10 * 1000, // 10 seconds — refetch quickly after invalidation
  });
}

// ─────────────────────────────────────────────
// GET single expense
// ─────────────────────────────────────────────

export function useExpense(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: expenseKeys.detail(groupId, expenseId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ expense: Expense }>
      >(`/groups/${groupId}/expenses/${expenseId}`);
      return response.data.data.expense;
    },
    enabled: !!groupId && !!expenseId,
  });
}

// ─────────────────────────────────────────────
// CREATE expense
// ─────────────────────────────────────────────

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateExpensePayload) => {
      const response = await apiClient.post<
        ApiSuccess<{ expense: Expense }>
      >(`/groups/${groupId}/expenses`, payload);
      return response.data.data.expense;
    },
    onSuccess: () => {
      // Invalidate ALL expense queries for this group
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "expenses" &&
            key.includes(groupId)
          );
        },
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.balances(groupId),
      });
    },
  });
}

// ─────────────────────────────────────────────
// UPDATE expense
// ─────────────────────────────────────────────

export function useUpdateExpense(
  groupId: string,
  expenseId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateExpensePayload) => {
      const response = await apiClient.patch<
        ApiSuccess<{ expense: Expense }>
      >(`/groups/${groupId}/expenses/${expenseId}`, payload);
      return response.data.data.expense;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "expenses" &&
            key.includes(groupId)
          );
        },
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.balances(groupId),
      });
    },
  });
}

// ─────────────────────────────────────────────
// DELETE expense
// ─────────────────────────────────────────────

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      await apiClient.delete(
        `/groups/${groupId}/expenses/${expenseId}`
      );
      return expenseId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "expenses" &&
            key.includes(groupId)
          );
        },
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.balances(groupId),
      });
    },
  });
}

// ─────────────────────────────────────────────
// GET expense history
// ─────────────────────────────────────────────

export function useExpenseHistory(
  groupId: string,
  expenseId: string
) {
  return useQuery({
    queryKey: expenseKeys.history(groupId, expenseId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ history: ExpenseHistoryEntry[] }>
      >(`/groups/${groupId}/expenses/${expenseId}/history`);
      return response.data.data.history;
    },
    enabled: !!groupId && !!expenseId,
    staleTime: 30 * 1000,
  });
}