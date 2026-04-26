// FILE: apps/web/src/components/settings/ProfileSection.tsx
// PURPOSE: Edit profile name + view email
// DEPENDS ON: useUpdateProfile, shadcn/ui
// LAST UPDATED: F38 - User Settings

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Pencil, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateProfile, getErrorMessage } from "@/hooks/useAuth";
import { getInitials, stringToColor, formatDate } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

const NameSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .trim(),
});

interface ProfileSectionProps {
  user: AuthUser;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateProfile, isPending, error } =
    useUpdateProfile();

  const form = useForm<{ name: string }>({
    resolver: zodResolver(NameSchema),
    defaultValues: { name: user.name },
  });

  const handleSave = (data: { name: string }) => {
    updateProfile(
      { name: data.name },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleCancel = () => {
    form.reset({ name: user.name });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User size={16} />
          Profile
        </CardTitle>
        <CardDescription>
          Your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{
              backgroundColor: stringToColor(user.name),
            }}
          >
            {getInitials(user.name)}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Name edit */}
        <div className="space-y-2">
          <Label>Display Name</Label>
          {isEditing ? (
            <form
              onSubmit={form.handleSubmit(handleSave)}
              className="flex items-center gap-2"
            >
              <Input
                className="flex-1"
                disabled={isPending}
                {...form.register("name")}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={isPending}
              >
                <Check size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X size={14} />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={user.name}
                disabled
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={14} />
              </Button>
            </div>
          )}
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive">
              {getErrorMessage(error)}
            </p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>
      </CardContent>
    </Card>
  );
}