// FILE: apps/web/src/components/shared/EmptyState.tsx
// PURPOSE: Reusable empty state with icon, title, description, action
// DEPENDS ON: lucide-react, shadcn/ui
// LAST UPDATED: F41 - Loading Skeletons + Empty States

"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted",
          compact ? "mb-3 h-10 w-10" : "mb-4 h-14 w-14"
        )}
      >
        <Icon
          className="text-muted-foreground"
          size={compact ? 20 : 28}
        />
      </div>
      <h3
        className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-1 max-w-sm text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}
      >
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}