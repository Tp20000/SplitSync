// FILE: apps/web/src/app/(dashboard)/analytics/page.tsx
// PURPOSE: Global analytics — spending overview across all groups
// DEPENDS ON: useGroups, chart components
// LAST UPDATED: F35 - Analytics Dashboard

"use client";

import Link from "next/link";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGroups } from "@/hooks/useGroups";
import { SummaryStats } from "@/components/charts/SummaryStats";
import { SpendingTrendChart } from "@/components/charts/SpendingTrendChart";

export default function AnalyticsPage() {
  const { data: groups, isLoading } = useGroups();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Spending insights across all your groups
        </p>
      </div>

      {/* Per-group analytics */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : !groups || groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BarChart3
              className="mx-auto mb-3 text-muted-foreground"
              size={40}
            />
            <p className="font-medium">No data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add expenses to groups to see analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.id} className="space-y-4">
              {/* Group header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {group.name}
                </h2>
                <Link
                  href={`/groups/${group.id}/analytics`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground"
                  >
                    Full analytics
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>

              {/* Summary + trend for this group */}
              <SummaryStats groupId={group.id} />
              <SpendingTrendChart groupId={group.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}