// FILE: apps/web/src/components/groups/GroupCard.tsx
// PURPOSE: Card UI for a single group in the list
// DEPENDS ON: shadcn/ui, Group type, GroupTypeIcon
// LAST UPDATED: F11 - Groups Frontend

"use client";

import Link from "next/link";
import { Users, Receipt, Crown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { GroupTypeIcon, getGroupTypeLabel } from "./GroupTypeIcon";
import { formatRelativeTime } from "@/lib/utils";
import type { Group } from "@/types/group";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card
        className={cn(
          "h-full cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
          group.isArchived && "opacity-60"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Icon + Name */}
            <div className="flex items-center gap-3 min-w-0">
              <GroupTypeIcon type={group.type} size={18} />
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {group.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {getGroupTypeLabel(group.type)}
                </p>
              </div>
            </div>

            {/* Admin badge */}
            {group.userRole === "admin" && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 shrink-0">
                <Crown size={10} />
                Admin
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          {group.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "member" : "members"}
            </span>

            {group.expenseCount !== undefined && (
              <span className="flex items-center gap-1.5">
                <Receipt size={13} />
                {group.expenseCount}{" "}
                {group.expenseCount === 1 ? "expense" : "expenses"}
              </span>
            )}
          </div>

          {/* Invite code */}
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {group.inviteCode}
            </span>
            {group.joinedAt && (
              <span className="text-xs text-muted-foreground">
                Joined {formatRelativeTime(group.joinedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}