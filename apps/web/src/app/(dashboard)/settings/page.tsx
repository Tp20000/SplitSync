// FILE: apps/web/src/app/(dashboard)/settings/page.tsx
// PURPOSE: Settings page — server component shell
// DEPENDS ON: SettingsClient
// LAST UPDATED: F38 - User Settings

import type { Metadata } from "next";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return <SettingsClient />;
}