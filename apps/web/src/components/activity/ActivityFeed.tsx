// FILE: apps/web/src/components/activity/ActivityFeed.tsx
// PURPOSE: Full activity feed with filter tabs
// DEPENDS ON: useActivity, useRealtimeActivity, ActivityItem
// LAST UPDATED: F37 - Activity Feed

"use client";

import { useState } from "react";
import { Activity, Receipt, ArrowRightLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityItemCard } from "./ActivityItem";
import { useActivity, useRealtimeActivity } from "@/hooks/useActivity";
import { cn } from "@/lib/utils";
import type { ActivityType } from "@/types/activity";

type FilterType = "all" | "expenses" | "settlements" | "groups";

const FILTER_CONFIG: Array<{
  value: FilterType;
  label: string;
  icon: React.ElementType;
  types: ActivityType[];
}> = [
  {
    value: "all",
    label: "All",
    icon: Activity,
    types: [],
  },
  {
    value: "expenses",
    label: "Expenses",
    icon: Receipt,
    types: ["expense_paid", "expense_split"],
  },
  {
    value: "settlements",
    label: "Settlements",
    icon: ArrowRightLeft,
    types: ["settlement_paid", "settlement_received"],
  },
  {
    value: "groups",
    label: "Groups",
    icon: Users,
    types: ["group_joined"],
  },
];

export function ActivityFeed() {
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: activities, isLoading } = useActivity(50);

  // Real-time updates
  useRealtimeActivity();

  // Apply filter
  const selectedFilter = FILTER_CONFIG.find(
    (f) => f.value === filter
  );

  const filtered =
    filter === "all"
      ? activities
      : activities?.filter((a) =>
          selectedFilter?.types.includes(a.type)
        );

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {FILTER_CONFIG.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setFilter(value)}
          >
            <Icon size={14} />
            {label}
          </Button>
        ))}
      </div>

      {/* Activity list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Activity
            className="mb-3 text-muted-foreground"
            size={40}
          />
          <p className="text-lg font-semibold">No activity yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "Your recent expenses, settlements, and group activity will appear here."
              : `No ${filter} activity found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <ActivityItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}