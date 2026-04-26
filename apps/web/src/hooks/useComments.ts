// FILE: apps/web/src/hooks/useComments.ts
// PURPOSE: TanStack Query hooks for comment API
// DEPENDS ON: @tanstack/react-query, apiClient
// LAST UPDATED: F28 - Comments on Expenses

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/axios";
import { useSocketEvent } from "@/hooks/useSocket";
import { useUser } from "@/stores/authStore";
import type { Comment } from "@/types/comment";
import type { ApiSuccess } from "@/types/auth";

export const commentKeys = {
  list: (groupId: string, expenseId: string) =>
    ["comments", groupId, expenseId] as const,
};

// GET comments
export function useComments(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: commentKeys.list(groupId, expenseId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ comments: Comment[] }>
      >(`/groups/${groupId}/expenses/${expenseId}/comments`);
      return response.data.data.comments;
    },
    enabled: !!groupId && !!expenseId,
    staleTime: 10 * 1000,
  });
}

// CREATE comment
export function useCreateComment(
  groupId: string,
  expenseId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post<
        ApiSuccess<{ comment: Comment }>
      >(`/groups/${groupId}/expenses/${expenseId}/comments`, {
        content,
      });
      return response.data.data.comment;
    },
    onSuccess: (newComment) => {
      // Optimistically add to list
      queryClient.setQueryData<Comment[]>(
        commentKeys.list(groupId, expenseId),
        (old) => (old ? [...old, newComment] : [newComment])
      );

      // Invalidate expense detail (comment count)
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
    },
  });
}

// Real-time comment updates
export function useRealtimeComments(
  groupId: string,
  expenseId: string
) {
  const queryClient = useQueryClient();
  const currentUser = useUser();

  useSocketEvent(
    "comment:created",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.expenseId !== expenseId) return;
        // Skip own comments (already added optimistically)
        if (data.comment.user.id === currentUser?.id) return;

        // Add to cache
        queryClient.setQueryData<Comment[]>(
          commentKeys.list(groupId, expenseId),
          (old) => {
            const newComment: Comment = {
              id: data.comment.id,
              expenseId: data.comment.expenseId,
              userId: data.comment.user.id,
              content: data.comment.content,
              createdAt: data.comment.createdAt,
              updatedAt: data.comment.createdAt,
              user: data.comment.user,
            };

            if (!old) return [newComment];
            // Avoid duplicates
            if (old.some((c) => c.id === newComment.id)) return old;
            return [...old, newComment];
          }
        );
      },
      [groupId, expenseId, queryClient, currentUser?.id]
    ),
    !!groupId && !!expenseId
  );
}