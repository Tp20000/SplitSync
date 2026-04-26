// FILE: apps/web/src/components/groups/OnlineMembers.tsx
// PURPOSE: Horizontal bar showing which members are currently online
// DEPENDS ON: useOnlineUsers, group members, AvatarWithPresence
// LAST UPDATED: F22 - Presence Indicators

"use client";

import { Wifi } from "lucide-react";
import { AvatarWithPresence } from "./OnlineIndicator";
import { useOnlineUsers } from "@/hooks/useSocket";
import { useUser } from "@/stores/authStore";
import type { GroupMember } from "@/types/group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OnlineMembersProps {
  groupId: string;
  members: GroupMember[];
}

export function OnlineMembers({
  groupId,
  members,
}: OnlineMembersProps) {
  const { onlineUserIds, count } = useOnlineUsers(groupId);
  const currentUser = useUser();

  // Include current user as online (they're always online to themselves)
  const allOnlineIds = new Set(onlineUserIds);
  if (currentUser?.id) {
    allOnlineIds.add(currentUser.id);
  }

  const onlineMembers = members.filter((m) =>
    allOnlineIds.has(m.userId)
  );

  const offlineCount = members.length - onlineMembers.length;

  if (onlineMembers.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Online indicator */}
      <div className="flex items-center gap-1.5">
        <Wifi size={12} className="text-green-500" />
        <span className="text-xs text-muted-foreground">
          {onlineMembers.length} online
          {offlineCount > 0 && (
            <span className="text-muted-foreground/60">
              {" "}
              · {offlineCount} offline
            </span>
          )}
        </span>
      </div>

      {/* Avatar stack */}
      <TooltipProvider delayDuration={300}>
        <div className="flex -space-x-2">
          {onlineMembers.slice(0, 5).map((member) => (
            <Tooltip key={member.userId}>
              <TooltipTrigger asChild>
                <div>
                  <AvatarWithPresence
                    name={member.user.name}
                    isOnline={true}
                    size="sm"
                    className="ring-2 ring-background"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {member.user.name}
                {member.userId === currentUser?.id && " (you)"}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow count */}
          {onlineMembers.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
              +{onlineMembers.length - 5}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}