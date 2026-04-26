// FILE: apps/web/src/hooks/useRealtimeExpenses.ts
// PURPOSE: Real-time expense + balance cache invalidation
// DEPENDS ON: useSocketEvent, useQueryClient
// LAST UPDATED: F24 - Real-Time Balance Updates

"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketEvent } from "@/hooks/useSocket";
import { groupKeys } from "@/hooks/useGroups";
import { useUser } from "@/stores/authStore";

export function useRealtimeExpenses(groupId: string | undefined) {
  const queryClient = useQueryClient();
  const currentUser = useUser();
  const enabled = !!groupId;

  // Invalidate ALL expense queries for a group
  const invalidateExpenses = useCallback(
    (gId: string) => {
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === "expenses" &&
            key.includes(gId)
          );
        },
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

  // Invalidate ALL balance queries (group + global)
  const invalidateBalances = useCallback(
    (gId: string) => {
      // Group-specific balances
      void queryClient.invalidateQueries({
        queryKey: groupKeys.balances(gId),
      });

      // Settle suggestions
      void queryClient.invalidateQueries({
        queryKey: [...groupKeys.balances(gId), "suggestions"],
      });

      // User's global balances (across all groups)
      void queryClient.invalidateQueries({
        queryKey: ["user", "balances"],
      });
    },
    [queryClient]
  );

  // Invalidate everything (expenses + balances)
  const invalidateAll = useCallback(
    (gId: string) => {
      invalidateExpenses(gId);
      invalidateBalances(gId);
    },
    [invalidateExpenses, invalidateBalances]
  );

  // ── expense:created ──
  useSocketEvent(
    "expense:created",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.createdBy === currentUser?.id) return;
        console.info("[Realtime] Expense created → refreshing all");
        invalidateAll(data.groupId);
      },
      [groupId, currentUser?.id, invalidateAll]
    ),
    enabled
  );

  // ── expense:updated ──
  useSocketEvent(
    "expense:updated",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.updatedBy === currentUser?.id) return;
        console.info("[Realtime] Expense updated → refreshing all");
        invalidateAll(data.groupId);
      },
      [groupId, currentUser?.id, invalidateAll]
    ),
    enabled
  );

  // ── expense:deleted ──
  useSocketEvent(
    "expense:deleted",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.deletedBy === currentUser?.id) return;
        console.info("[Realtime] Expense deleted → refreshing all");
        invalidateAll(data.groupId);
      },
      [groupId, currentUser?.id, invalidateAll]
    ),
    enabled
  );

  // ── balance:updated ──
  useSocketEvent(
    "balance:updated",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        console.info("[Realtime] Balance updated → refreshing balances");
        invalidateBalances(data.groupId);
      },
      [groupId, invalidateBalances]
    ),
    enabled
  );

  // ── settlement:created ──
  useSocketEvent(
    "settlement:created",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        console.info("[Realtime] Settlement created → refreshing all");
        invalidateAll(data.groupId);
      },
      [groupId, invalidateAll]
    ),
    enabled
  );
}