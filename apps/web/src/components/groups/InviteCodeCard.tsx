// FILE: apps/web/src/components/groups/InviteCodeCard.tsx
// PURPOSE: Shows group invite code with copy + regenerate actions
// DEPENDS ON: shadcn/ui, useRegenerateInviteCode
// LAST UPDATED: F12 - Group Members UI

"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRegenerateInviteCode } from "@/hooks/useGroups";
import { getErrorMessage } from "@/lib/queryClient";

interface InviteCodeCardProps {
  groupId: string;
  inviteCode: string;
  isAdmin: boolean;
}

export function InviteCodeCard({
  groupId,
  inviteCode,
  isAdmin,
}: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const {
    mutate: regenerate,
    isPending,
    error,
  } = useRegenerateInviteCode(groupId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    regenerate();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Invite Code</CardTitle>
        <CardDescription>
          Share this code with people you want to invite
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Code display */}
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg border bg-muted/50 px-4 py-3">
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-center">
              {inviteCode}
            </p>
          </div>

          {/* Copy button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => void handleCopy()}
            title="Copy invite code"
          >
            {copied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy size={16} />
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive">
            {getErrorMessage(error)}
          </p>
        )}

        {/* Regenerate — admin only */}
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-muted-foreground"
                disabled={isPending}
              >
                <RefreshCw
                  size={14}
                  className={isPending ? "animate-spin" : ""}
                />
                Regenerate invite code
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Regenerate invite code?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  The current invite code{" "}
                  <span className="font-mono font-bold">
                    {inviteCode}
                  </span>{" "}
                  will stop working immediately. Anyone with the
                  old code won&apos;t be able to join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}