// FILE: apps/web/src/components/activity/ActivityItem.tsx
// PURPOSE: Single activity item in the feed
// DEPENDS ON: shadcn/ui, lucide-react
// LAST UPDATED: F37 - Activity Feed

"use client";

import Link from "next/link";
import {
  Receipt,
  ArrowRightLeft,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  formatCurrency,
  formatRelativeTime,
  formatDate,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ActivityItem as ActivityItemType } from "@/types/activity";

interface ActivityItemProps {
  item: ActivityItemType;
}

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
  }
> = {
  expense_paid: {
    icon: ArrowUpRight,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  expense_split: {
    icon: Receipt,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  settlement_paid: {
    icon: ArrowUpRight,
    color: "text-red-600",
    bg: "bg-red-100",
  },
  settlement_received: {
    icon: ArrowDownLeft,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  group_joined: {
    icon: UserPlus,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
};

export function ActivityItemCard({ item }: ActivityItemProps) {
  const config = TYPE_CONFIG[item.type] ?? {
    icon: ArrowRightLeft,
    color: "text-muted-foreground",
    bg: "bg-muted",
  };

  const Icon = config.icon;

  return (
    <Link href={`/groups/${item.groupId}`}>
      <div className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-primary/20 hover:-translate-y-px">
        {/* Icon */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            config.bg
          )}
        >
          <Icon size={18} className={config.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.description}
          </p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {item.groupName}
            </span>
            <span
              className="text-[10px] text-muted-foreground"
              title={formatDate(item.timestamp)}
            >
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
        </div>

        {/* Amount */}
        {item.amount && item.currency && (
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                item.type === "settlement_received" ||
                  item.type === "expense_paid"
                  ? "text-green-600"
                  : item.type === "settlement_paid"
                    ? "text-red-600"
                    : "text-foreground"
              )}
            >
              {item.type === "settlement_received" && "+"}
              {item.type === "settlement_paid" && "-"}
              {formatCurrency(item.amount, item.currency)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}