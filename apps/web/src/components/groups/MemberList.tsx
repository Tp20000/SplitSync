// FILE: apps/web/src/components/groups/MemberList.tsx
// PURPOSE: Full member list with search + admin management actions
// DEPENDS ON: MemberCard, useGroupMembers, shadcn/ui
// LAST UPDATED: F12 - Group Members UI

"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MemberCard } from "./MemberCard";
import { useGroupMembers } from "@/hooks/useGroups";
import type { GroupMember } from "@/types/group";

interface MemberListProps {
  groupId: string;
  currentUserId: string;
  currentUserRole: "admin" | "member";
}

export function MemberList({
  groupId,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const [search, setSearch] = useState("");
  const { data: members, isLoading } = useGroupMembers(groupId);

  // Filter members by search query
  const filtered = members?.filter(
    (m) =>
      m.user.name.toLowerCase().includes(search.toLowerCase()) ||
      m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Split into admins and members
  const admins =
    filtered?.filter((m) => m.role === "admin") ?? [];
  const regularMembers =
    filtered?.filter((m) => m.role === "member") ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={16} />
              Members
              {members && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({members.length})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {currentUserRole === "admin"
                ? "Manage group members and roles"
                : "People in this group"}
            </CardDescription>
          </div>
        </div>

        {/* Search */}
        {members && members.length > 4 && (
          <div className="relative mt-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search members..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          // Skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3"
              >
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Admins */}
            {admins.length > 0 && (
              <div>
                {admins.map((member, i) => (
                  <div key={member.id}>
                    <MemberCard
                      member={member}
                      groupId={groupId}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                    {i < admins.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            {admins.length > 0 && regularMembers.length > 0 && (
              <Separator />
            )}

            {/* Regular members */}
            {regularMembers.length > 0 && (
              <div>
                {regularMembers.map((member, i) => (
                  <div key={member.id}>
                    <MemberCard
                      member={member}
                      groupId={groupId}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                    {i < regularMembers.length - 1 && (
                      <Separator />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty search result */}
            {filtered?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No members match &quot;{search}&quot;
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}