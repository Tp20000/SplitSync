// FILE: apps/web/src/app/(dashboard)/activity/page.tsx
// PURPOSE: Activity feed page — shows all user activity
// DEPENDS ON: ActivityFeed
// LAST UPDATED: F37 - Activity Feed

import type { Metadata } from "next";
import { ActivityClient } from "@/components/activity/ActivityClient";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return <ActivityClient />;
}