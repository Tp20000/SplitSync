// FILE: apps/web/src/components/groups/GroupList.tsx
// PURPOSE: Renders group cards grid with empty state
// DEPENDS ON: useGroups, GroupCard, shadcn/ui
// LAST UPDATED: F11 - Groups Frontend

"use client";

import { Users } from "lucide-react";
import { GroupCard } from "./GroupCard";
import { CreateGroupModal } from "./CreateGroupModal";
import { JoinGroupModal } from "./JoinGroupModal";
import { useGroups } from "@/hooks/useGroups";
import { GroupCardSkeleton } from "./GroupCardSkeleton";

export function GroupList() {
  const { data: groups, isLoading, error } = useGroups();

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load groups. Please try again.
        </p>
      </div>
    );
  }

  // ── Empty state ──
  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No groups yet</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Create a group to start splitting expenses, or join an
          existing one with an invite code.
        </p>
        <div className="flex gap-3">
          <CreateGroupModal />
          <JoinGroupModal />
        </div>
      </div>
    );
  }

  // ── Groups grid ──
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}