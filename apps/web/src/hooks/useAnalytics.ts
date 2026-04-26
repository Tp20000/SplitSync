// FILE: apps/web/src/hooks/useAnalytics.ts
// PURPOSE: TanStack Query hooks for analytics API
// DEPENDS ON: @tanstack/react-query, apiClient
// LAST UPDATED: F35 - Analytics Dashboard

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type {
  GroupSummary,
  TrendDataPoint,
  CategoryBreakdown,
  MemberSpendingData,
} from "@/types/analytics";
import type { ApiSuccess } from "@/types/auth";

export const analyticsKeys = {
  summary: (groupId: string) =>
    ["analytics", groupId, "summary"] as const,
  trends: (groupId: string, period: string) =>
    ["analytics", groupId, "trends", period] as const,
  categories: (groupId: string) =>
    ["analytics", groupId, "categories"] as const,
  members: (groupId: string) =>
    ["analytics", groupId, "members"] as const,
};

export function useGroupSummary(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.summary(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<GroupSummary>
      >(`/groups/${groupId}/analytics/summary`);
      return response.data.data;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSpendingTrends(
  groupId: string,
  period: "daily" | "weekly" | "monthly" = "monthly"
) {
  return useQuery({
    queryKey: analyticsKeys.trends(groupId, period),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ trends: TrendDataPoint[]; period: string }>
      >(`/groups/${groupId}/analytics/trends?period=${period}`);
      return response.data.data;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryBreakdown(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.categories(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<CategoryBreakdown>
      >(`/groups/${groupId}/analytics/categories`);
      return response.data.data;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemberSpending(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.members(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ members: MemberSpendingData[] }>
      >(`/groups/${groupId}/analytics/members`);
      return response.data.data.members;
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}