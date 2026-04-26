// FILE: apps/web/src/hooks/useRealtimeGroup.ts
// PURPOSE: Listens for real-time group member + settlement events
// DEPENDS ON: useSocketEvent, useQueryClient
// LAST UPDATED: F21 Fix - Query invalidation matching

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "@/hooks/useSocket";
import { groupKeys } from "@/hooks/useGroups";

export function useRealtimeGroup(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const enabled = !!groupId;

  const invalidateGroupData = useCallback(
    (gId: string) => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(gId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(gId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
    [queryClient]
  );

  // ── member:joined ──
  useSocketEvent(
    "member:joined",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        console.info("[Realtime] Member joined — refetching");
        invalidateGroupData(data.groupId);
      },
      [groupId, invalidateGroupData]
    ),
    enabled
  );

  // ── member:left ──
  useSocketEvent(
    "member:left",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        console.info("[Realtime] Member left — refetching");
        invalidateGroupData(data.groupId);
      },
      [groupId, invalidateGroupData]
    ),
    enabled
  );

  // ── settlement:created ──
  useSocketEvent(
    "settlement:created",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        console.info("[Realtime] Settlement created — refetching");
        void queryClient.invalidateQueries({
          queryKey: groupKeys.balances(data.groupId),
        });
      },
      [groupId, queryClient]
    ),
    enabled
  );
}