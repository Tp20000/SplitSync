// FILE: apps/web/src/hooks/useRecurring.ts
// PURPOSE: TanStack Query hooks for recurring expense rules
// DEPENDS ON: @tanstack/react-query, apiClient
// LAST UPDATED: F31 - Recurring Expenses Engine

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type { RecurringRule } from "@/types/recurring";
import type { ApiSuccess } from "@/types/auth";
import type { SplitEntry } from "@/types/expense";

export const recurringKeys = {
  list: (groupId: string) =>
    ["recurring", groupId] as const,
};

// GET rules
export function useRecurringRules(groupId: string) {
  return useQuery({
    queryKey: recurringKeys.list(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ rules: RecurringRule[] }>
      >(`/groups/${groupId}/recurring`);
      return response.data.data.rules;
    },
    enabled: !!groupId,
  });
}

// CREATE rule
export function useCreateRecurringRule(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      totalAmount: number;
      currency?: string;
      category: string;
      splitType: string;
      splits: SplitEntry[];
      paidBy?: string;
      frequency: string;
      startDate?: string;
    }) => {
      const response = await apiClient.post<
        ApiSuccess<{ rule: RecurringRule }>
      >(
        `/groups/${groupId}/recurring`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.data.rule;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recurringKeys.list(groupId),
      });
    },
  });
}

// TOGGLE active/inactive
export function useToggleRecurringRule(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ruleId,
      isActive,
    }: {
      ruleId: string;
      isActive: boolean;
    }) => {
      const response = await apiClient.patch<
        ApiSuccess<{ rule: RecurringRule }>
      >(`/groups/${groupId}/recurring/${ruleId}`, { isActive });
      return response.data.data.rule;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recurringKeys.list(groupId),
      });
    },
  });
}

// DELETE rule
export function useDeleteRecurringRule(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(
        `/groups/${groupId}/recurring/${ruleId}`
      );
      return ruleId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: recurringKeys.list(groupId),
      });
    },
  });
}