// FILE: apps/web/src/hooks/useBalances.ts
// PURPOSE: TanStack Query hooks for balance API
// DEPENDS ON: @tanstack/react-query, apiClient, balance types
// LAST UPDATED: F16 - Balance Calculation Engine

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { groupKeys } from "@/hooks/useGroups";
import type { GroupBalanceResult, UserGroupBalance } from "@/types/balance";
import type { ApiSuccess } from "@/types/auth";

// ─────────────────────────────────────────────
// GET group balances
// ─────────────────────────────────────────────

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: groupKeys.balances(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<GroupBalanceResult>
      >(`/groups/${groupId}/balances`);
      return response.data.data;
    },
    enabled: !!groupId,
    // Balances change when expenses change — keep fresh
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ─────────────────────────────────────────────
// GET settle suggestions
// ─────────────────────────────────────────────

export function useSettleSuggestions(groupId: string) {
  return useQuery({
    queryKey: [...groupKeys.balances(groupId), "suggestions"],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{
          groupId: string;
          suggestions: Array<{
            from: { userId: string; name: string; avatarUrl: string | null };
            to: { userId: string; name: string; avatarUrl: string | null };
            amount: string;
            currency: string;
          }>;
          currency: string;
        }>
      >(`/groups/${groupId}/settle-suggestions`);
      return response.data.data;
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}

// ─────────────────────────────────────────────
// GET user balances across all groups
// ─────────────────────────────────────────────

export function useUserBalances() {
  return useQuery({
    queryKey: ["user", "balances"],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ balances: UserGroupBalance[] }>
      >("/users/me/balances");
      return response.data.data.balances;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}