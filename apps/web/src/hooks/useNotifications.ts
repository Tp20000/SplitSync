// FILE: apps/web/src/hooks/useNotifications.ts
// PURPOSE: TanStack Query hooks for notification API + real-time
// DEPENDS ON: @tanstack/react-query, apiClient, useSocketEvent
// LAST UPDATED: F29 - Notification System

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/axios";
import { useSocketEvent } from "@/hooks/useSocket";
import type {
  Notification,
  NotificationMeta,
} from "@/types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
};

// ─────────────────────────────────────────────
// GET notifications
// ─────────────────────────────────────────────

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: [...notificationKeys.list(), page],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: true;
        data: Notification[];
        meta: NotificationMeta;
      }>(`/notifications?page=${page}&limit=20`);
      return {
        notifications: response.data.data,
        meta: response.data.meta,
      };
    },
    staleTime: 30 * 1000,
  });
}

// ─────────────────────────────────────────────
// MARK one as read
// ─────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(
        `/notifications/${notificationId}/read`
      );
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update cache optimistically
      queryClient.setQueryData<{
        notifications: Notification[];
        meta: NotificationMeta;
      }>(
        [...notificationKeys.list(), 1],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            meta: {
              ...old.meta,
              unreadCount: Math.max(0, old.meta.unreadCount - 1),
            },
          };
        }
      );
    },
  });
}

// ─────────────────────────────────────────────
// MARK ALL as read
// ─────────────────────────────────────────────

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.list(),
      });
    },
  });
}

// ─────────────────────────────────────────────
// Real-time: listen for new notifications
// ─────────────────────────────────────────────

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useSocketEvent(
    "notification:new",
    useCallback(
      (data) => {
        // Prepend to notification list
        queryClient.setQueryData<{
          notifications: Notification[];
          meta: NotificationMeta;
        }>(
          [...notificationKeys.list(), 1],
          (old) => {
            const newNotification: Notification = {
              id: data.id,
              userId: "",
              type: data.type as Notification["type"],
              title: data.title,
              body: data.body ?? null,
              metadata:
                (data.metadata as Record<string, unknown>) ?? null,
              isRead: false,
              createdAt: new Date().toISOString(),
            };

            if (!old) {
              return {
                notifications: [newNotification],
                meta: {
                  page: 1,
                  limit: 20,
                  total: 1,
                  totalPages: 1,
                  hasNext: false,
                  hasPrev: false,
                  unreadCount: 1,
                },
              };
            }

            return {
              notifications: [
                newNotification,
                ...old.notifications.slice(0, 19), // Keep max 20
              ],
              meta: {
                ...old.meta,
                total: old.meta.total + 1,
                unreadCount: old.meta.unreadCount + 1,
              },
            };
          }
        );
      },
      [queryClient]
    )
  );
}