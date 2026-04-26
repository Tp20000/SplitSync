// FILE: apps/web/src/components/groups/MemberCard.tsx
// PURPOSE: Single member row with role badge + admin actions
// DEPENDS ON: shadcn/ui, useUpdateMemberRole, useRemoveMember
// LAST UPDATED: F12 - Group Members UI

"use client";

import { Crown, MoreVertical, UserMinus, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { getInitials, stringToColor } from "@/lib/utils";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/useGroups";
import type { GroupMember } from "@/types/group";
import { AvatarWithPresence } from "./OnlineIndicator";
import { useOnlineUsers } from "@/hooks/useSocket";

interface MemberCardProps {
  member: GroupMember;
  groupId: string;
  currentUserId: string;
  currentUserRole: "admin" | "member";
}

export function MemberCard({
  member,
  groupId,
  currentUserId,
  currentUserRole,
}: MemberCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const { mutate: updateRole, isPending: isUpdatingRole } =
    useUpdateMemberRole(groupId);
  const { mutate: removeMember, isPending: isRemoving } =
    useRemoveMember(groupId);
  
  const { isUserOnline } = useOnlineUsers(groupId);
  const isCurrentUser = member.userId === currentUserId;
  const isOnline = isCurrentUser || isUserOnline(member.userId);

  
  const isAdmin = currentUserRole === "admin";
  const canManage = isAdmin && !isCurrentUser && member.role !== "admin";

  const handleRoleToggle = () => {
    const newRole = member.role === "admin" ? "member" : "admin";
    updateRole({ userId: member.userId, role: newRole });
  };

  const handleRemove = () => {
    removeMember(member.userId, {
      onSuccess: () => setShowRemoveDialog(false),
    });
  };

  return (
    <>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {/* Avatar with presence */}
          <AvatarWithPresence
            name={member.user.name}
            isOnline={isOnline}
            size="md"
          />

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {member.user.name}
              </p>
              {isCurrentUser && (
                <span className="text-xs text-muted-foreground">
                  (you)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {member.user.email}
            </p>
          </div>
        </div>

        {/* Right side — role badge + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role Badge */}
          {member.role === "admin" ? (
            <Badge variant="admin" className="gap-1">
              <Crown size={10} />
              Admin
            </Badge>
          ) : (
            <Badge variant="member">Member</Badge>
          )}

          {/* Admin action menu */}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isUpdatingRole || isRemoving}
                >
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleRoleToggle}
                  disabled={isUpdatingRole}
                  className="gap-2"
                >
                  <ArrowUpDown size={14} />
                  {member.role === "admin"
                    ? "Demote to Member"
                    : "Promote to Admin"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => setShowRemoveDialog(true)}
                  disabled={isRemoving}
                >
                  <UserMinus size={14} />
                  Remove from group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{member.user.name}</span>{" "}
              from this group? They will lose access to all group
              expenses and balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}