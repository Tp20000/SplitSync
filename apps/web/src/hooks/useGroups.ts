// FILE: apps/web/src/hooks/useGroups.ts
// PURPOSE: TanStack Query hooks for all group API operations
// DEPENDS ON: @tanstack/react-query, apiClient, group types
// LAST UPDATED: F11 - Groups Frontend

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import type {
  Group,
  GroupMember,
  CreateGroupPayload,
  UpdateGroupPayload,
} from "@/types/group";
import type { ApiSuccess } from "@/types/auth";

// ─────────────────────────────────────────────
// Query Keys — single source of truth
// ─────────────────────────────────────────────

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  detail: (id: string) => [...groupKeys.all, "detail", id] as const,
  members: (id: string) => [...groupKeys.all, "members", id] as const,
  balances: (id: string) =>
    [...groupKeys.all, "balances", id] as const,
};

// ─────────────────────────────────────────────
// GET all groups for current user
// ─────────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: groupKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ groups: Group[] }>
      >("/groups");
      return response.data.data.groups;
    },
  });
}

// ─────────────────────────────────────────────
// GET single group by ID
// ─────────────────────────────────────────────

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ group: Group }>
      >(`/groups/${groupId}`);
      return response.data.data.group;
    },
    enabled: !!groupId,
  });
}

// ─────────────────────────────────────────────
// GET group members
// ─────────────────────────────────────────────

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccess<{ members: GroupMember[] }>
      >(`/groups/${groupId}/members`);
      return response.data.data.members;
    },
    enabled: !!groupId,
  });
}

// ─────────────────────────────────────────────
// CREATE group mutation
// ─────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const response = await apiClient.post<
        ApiSuccess<{ group: Group }>
      >("/groups", payload);
      return response.data.data.group;
    },
    onSuccess: (newGroup) => {
      // Add to existing list
      queryClient.setQueryData<Group[]>(
        groupKeys.lists(),
        (old) => (old ? [newGroup, ...old] : [newGroup])
      );
      // Invalidate to refetch fresh data
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}

// ─────────────────────────────────────────────
// UPDATE group mutation
// ─────────────────────────────────────────────

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateGroupPayload) => {
      const response = await apiClient.patch<
        ApiSuccess<{ group: Group }>
      >(`/groups/${groupId}`, payload);
      return response.data.data.group;
    },
    onSuccess: (updatedGroup) => {
      // Update detail cache
      queryClient.setQueryData(
        groupKeys.detail(groupId),
        updatedGroup
      );
      // Invalidate list
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}

// ─────────────────────────────────────────────
// JOIN group mutation
// ─────────────────────────────────────────────

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.post<
        ApiSuccess<{ groupId: string; groupName: string }>
      >("/groups/join", { inviteCode });
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}

// ─────────────────────────────────────────────
// LEAVE group mutation
// ─────────────────────────────────────────────

export function useLeaveGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      // Remove from list
      queryClient.setQueryData<Group[]>(
        groupKeys.lists(),
        (old) => old?.filter((g) => g.id !== groupId) ?? []
      );
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}

// ─────────────────────────────────────────────
// DELETE / archive group mutation
// ─────────────────────────────────────────────

export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.setQueryData<Group[]>(
        groupKeys.lists(),
        (old) => old?.filter((g) => g.id !== groupId) ?? []
      );
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}
// ─────────────────────────────────────────────
// UPDATE member role mutation
// ─────────────────────────────────────────────

export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "member";
    }) => {
      const response = await apiClient.patch<
        ApiSuccess<{ member: GroupMember }>
      >(`/groups/${groupId}/members/${userId}/role`, { role });
      return response.data.data.member;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      });
    },
  });
}

// ─────────────────────────────────────────────
// REMOVE member mutation
// ─────────────────────────────────────────────

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(
        `/groups/${groupId}/members/${userId}`
      );
      return userId;
    },
    onSuccess: (removedUserId) => {
      // Optimistically remove from member list
      queryClient.setQueryData<GroupMember[]>(
        groupKeys.members(groupId),
        (old) =>
          old?.filter((m) => m.userId !== removedUserId) ?? []
      );
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      });
    },
  });
}

// ─────────────────────────────────────────────
// REGENERATE invite code mutation
// ─────────────────────────────────────────────

export function useRegenerateInviteCode(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<
        ApiSuccess<{ id: string; inviteCode: string }>
      >(`/groups/${groupId}/invite/regenerate`);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update group detail with new code
      queryClient.setQueryData<Group>(
        groupKeys.detail(groupId),
        (old) =>
          old ? { ...old, inviteCode: data.inviteCode } : old
      );
      void queryClient.invalidateQueries({
        queryKey: groupKeys.lists(),
      });
    },
  });
}