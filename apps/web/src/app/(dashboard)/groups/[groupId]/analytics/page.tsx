

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryStats } from "@/components/charts/SummaryStats";
import { SpendingTrendChart } from "@/components/charts/SpendingTrendChart";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { MemberSpendingChart } from "@/components/charts/MemberSpendingChart";
import { useGroup } from "@/hooks/useGroups";
import { ExportPdfButton } from "@/components/groups/ExportPdfButton";

export default function GroupAnalyticsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: group } = useGroup(groupId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/groups/${groupId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            {group?.name ?? "Group"} spending insights
          </p>
        </div>
        {/* Export PDF */}
        {group && (
          <ExportPdfButton
            groupId={groupId}
            groupName={group.name}
          />
        )}
      </div>


      <SummaryStats groupId={groupId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingTrendChart
          groupId={groupId}
          className="lg:col-span-2"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdownChart groupId={groupId} />
        <MemberSpendingChart groupId={groupId} />
      </div>
    </div>
  );
}