// FILE: apps/web/src/hooks/useActivity.ts
// PURPOSE: TanStack Query hook for user activity feed
// DEPENDS ON: @tanstack/react-query, apiClient
// LAST UPDATED: F37 - Activity Feed

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/axios";
import { useSocketEvent } from "@/hooks/useSocket";
import type { ActivityItem } from "@/types/activity";
import type { ApiSuccess } from "@/types/auth";

export const activityKeys = {
  all: ["activity"] as const,
};

export function useActivity(limit = 30) {
  return useQuery({
    queryKey: activityKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<ActivityItem[]>
      >(`/users/me/activity?limit=${limit}`);
      return response.data.data;
    },
    staleTime: 30 * 1000,
  });
}

// Refresh activity feed on real-time events
export function useRealtimeActivity() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: activityKeys.all,
    });
  }, [queryClient]);

  useSocketEvent("expense:created", invalidate);
  useSocketEvent("expense:deleted", invalidate);
  useSocketEvent("settlement:created", invalidate);
  useSocketEvent("member:joined", invalidate);
}