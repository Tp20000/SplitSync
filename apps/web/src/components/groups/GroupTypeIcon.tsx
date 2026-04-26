// FILE: apps/web/src/components/groups/GroupTypeIcon.tsx
// PURPOSE: Returns icon + color for each group type
// DEPENDS ON: lucide-react
// LAST UPDATED: F11 - Groups Frontend

import {
  Globe,
  Plane,
  Home,
  Heart,
  Star,
  MoreHorizontal,
} from "lucide-react";
import type { GroupType } from "@/types/group";
import { cn } from "@/lib/utils";

interface GroupTypeIconProps {
  type: GroupType;
  className?: string;
  size?: number;
}

const TYPE_CONFIG: Record<
  GroupType,
  {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
  }
> = {
  general: {
    icon: Globe,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "General",
  },
  trip: {
    icon: Plane,
    color: "text-purple-600",
    bg: "bg-purple-100",
    label: "Trip",
  },
  home: {
    icon: Home,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Home",
  },
  couple: {
    icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-100",
    label: "Couple",
  },
  event: {
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-100",
    label: "Event",
  },
  other: {
    icon: MoreHorizontal,
    color: "text-slate-600",
    bg: "bg-slate-100",
    label: "Other",
  },
};

export function GroupTypeIcon({
  type,
  className,
  size = 20,
}: GroupTypeIconProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg p-2",
        config.bg,
        className
      )}
    >
      <Icon size={size} className={config.color} />
    </div>
  );
}

export function getGroupTypeLabel(type: GroupType): string {
  return TYPE_CONFIG[type]?.label ?? "General";
}

export { TYPE_CONFIG };