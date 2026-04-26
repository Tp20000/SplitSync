// FILE: apps/web/src/components/activity/ActivityClient.tsx
// PURPOSE: Client component shell for activity page
// DEPENDS ON: ActivityFeed
// LAST UPDATED: F37 - Activity Feed

"use client";

import { ActivityFeed } from "./ActivityFeed";

export function ActivityClient() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Activity
        </h1>
        <p className="text-muted-foreground">
          Your recent expenses, settlements, and group activity
        </p>
      </div>

      {/* Feed */}
      <ActivityFeed />
    </div>
  );
}