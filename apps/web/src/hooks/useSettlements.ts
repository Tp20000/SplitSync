// FILE: apps/web/src/hooks/useSettlements.ts
// PURPOSE: TanStack Query hooks for settlement API
// DEPENDS ON: @tanstack/react-query, apiClient
// LAST UPDATED: F25 - Settlement Recording API

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { groupKeys } from "@/hooks/useGroups";
import type { Settlement, CreateSettlementPayload } from "@/types/settlement";
import type { ApiSuccess } from "@/types/auth";

export const settlementKeys = {
  all: ["settlements"] as const,
  list: (groupId: string) =>
    [...settlementKeys.all, "list", groupId] as const,
};

// GET settlements
export function useSettlements(groupId: string, page = 1) {
  return useQuery({
    queryKey: [...settlementKeys.list(groupId), page],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: true;
        data: Settlement[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>(`/groups/${groupId}/settlements?page=${page}&limit=20`);
      return {
        settlements: response.data.data,
        meta: response.data.meta,
      };
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}

// CREATE settlement
export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSettlementPayload) => {
      const response = await apiClient.post<
        ApiSuccess<{ settlement: Settlement }>
      >(`/groups/${groupId}/settlements`, payload);
      return response.data.data.settlement;
    },
    onSuccess: () => {
      // Invalidate settlements list
      void queryClient.invalidateQueries({
        queryKey: settlementKeys.list(groupId),
      });

      // Invalidate ALL balances
      void queryClient.invalidateQueries({
        queryKey: groupKeys.balances(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...groupKeys.balances(groupId), "suggestions"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["user", "balances"],
      });

      // Invalidate group detail
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      });
    },
  });
}