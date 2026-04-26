// FILE: apps/web/src/components/groups/CreateGroupModal.tsx
// PURPOSE: Modal form for creating a new group
// DEPENDS ON: react-hook-form, zod, shadcn/ui, useCreateGroup
// LAST UPDATED: F11 - Groups Frontend

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateGroup } from "@/hooks/useGroups";
import { getErrorMessage } from "@/lib/queryClient";
import {
  CreateGroupSchema,
  type CreateGroupInput,
  GROUP_TYPES,
} from "@/lib/validations/group";
import { getGroupTypeLabel } from "./GroupTypeIcon";
import type { GroupType } from "@/types/group";
import { useToast } from "@/hooks/useToast";

interface CreateGroupModalProps {
  trigger?: React.ReactNode;
}

export function CreateGroupModal({ trigger }: CreateGroupModalProps) {
  const [open, setOpen] = useState(false);
  const { mutate: createGroup, isPending, error } = useCreateGroup();

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(CreateGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "general",
    },
  });

    const { success: toastSuccess } = useToast();
  const onSubmit = (data: CreateGroupInput) => {
    createGroup(
      {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          toastSuccess(
            "Group created",
            "Your new group is ready. Share the invite code with your friends!"
          );
        },
      }
    );
  };

  const serverError = error ? getErrorMessage(error) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus size={16} />
            New Group
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new group</DialogTitle>
          <DialogDescription>
            Add a name and type to get started. You can invite
            members after creation.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name *</Label>
            <Input
              id="group-name"
              placeholder="e.g. Goa Trip 2024"
              disabled={isPending}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="group-type">Group type</Label>
            <Select
              defaultValue="general"
              onValueChange={(val) =>
                form.setValue("type", val as GroupType)
              }
              disabled={isPending}
            >
              <SelectTrigger id="group-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getGroupTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="group-description"
              placeholder="What's this group for?"
              disabled={isPending}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
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
            <Button type="submit" loading={isPending} disabled={isPending}>
              Create group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}