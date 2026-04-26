// FILE: apps/web/src/components/groups/JoinGroupModal.tsx
// PURPOSE: Modal for joining a group via invite code
// DEPENDS ON: react-hook-form, zod, shadcn/ui, useJoinGroup
// LAST UPDATED: F11 - Groups Frontend

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useJoinGroup } from "@/hooks/useGroups";
import { getErrorMessage } from "@/lib/queryClient";
import {
  JoinGroupSchema,
  type JoinGroupInput,
} from "@/lib/validations/group";
import { useToast } from "@/hooks/useToast";

interface JoinGroupModalProps {
  trigger?: React.ReactNode;
}

export function JoinGroupModal({ trigger }: JoinGroupModalProps) {
  const [open, setOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { mutate: joinGroup, isPending, error } = useJoinGroup();

  const form = useForm<JoinGroupInput>({
    resolver: zodResolver(JoinGroupSchema),
    defaultValues: { inviteCode: "" },
  });

  const { success: toastSuccess } = useToast();

  const onSubmit = (data: JoinGroupInput) => {
    joinGroup(data.inviteCode, {
            onSuccess: (result) => {
        toastSuccess(
          "Joined group",
          `You've joined "${result.groupName}" successfully!`
        );
        setSuccessMessage(
          `You've joined "${result.groupName}" successfully!`
        );
        setTimeout(() => {
          setOpen(false);
          setSuccessMessage("");
          form.reset();
        }, 1500);
      },
    });
  };

  const serverError = error ? getErrorMessage(error) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          form.reset();
          setSuccessMessage("");
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <LogIn size={16} />
            Join Group
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a group</DialogTitle>
          <DialogDescription>
            Enter the invite code shared by your group admin.
          </DialogDescription>
        </DialogHeader>

        {/* Success state */}
        {successMessage ? (
          <div className="rounded-md bg-green-50 px-4 py-4 text-center text-sm text-green-700">
            ✅ {successMessage}
          </div>
        ) : (
          <>
            {serverError && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite code</Label>
                <Input
                  id="invite-code"
                  placeholder="e.g. AB12CD34"
                  className="font-mono tracking-widest uppercase"
                  maxLength={12}
                  disabled={isPending}
                  {...form.register("inviteCode")}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    form.setValue(
                      "inviteCode",
                      e.target.value.toUpperCase()
                    );
                  }}
                />
                {form.formState.errors.inviteCode && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.inviteCode.message}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  disabled={isPending}
                >
                  Join group
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}