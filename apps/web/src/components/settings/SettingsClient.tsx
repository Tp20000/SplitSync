// FILE: apps/web/src/components/settings/SettingsClient.tsx
// PURPOSE: Client-side settings page container
// DEPENDS ON: all setting sections
// LAST UPDATED: F38 - User Settings

"use client";

import { Separator } from "@/components/ui/separator";
import { useUser } from "@/stores/authStore";
import { ProfileSection } from "./ProfileSection";
import { CurrencySection } from "./CurrencySection";
import { SecuritySection } from "./SecuritySection";
import { DangerZone } from "./DangerZone";

export function SettingsClient() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      <ProfileSection user={user} />

      <Separator />

      <CurrencySection user={user} />

      <Separator />

      <SecuritySection />

      <Separator />

      <DangerZone />
    </div>
  );
}