// FILE: apps/web/src/components/groups/OnlineIndicator.tsx
// PURPOSE: Green dot overlay + avatar wrapper for online users
// DEPENDS ON: cn, utils
// LAST UPDATED: F22 - Presence Indicators

import { cn } from "@/lib/utils";
import { getInitials, stringToColor } from "@/lib/utils";

// ─────────────────────────────────────────────
// Online dot
// ─────────────────────────────────────────────

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineIndicator({
  isOnline,
  size = "md",
  className,
}: OnlineIndicatorProps) {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <span
      className={cn(
        "absolute block rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900",
        sizeClasses[size],
        className
      )}
      title="Online"
    />
  );
}

// ─────────────────────────────────────────────
// Avatar with online indicator
// ─────────────────────────────────────────────

interface AvatarWithPresenceProps {
  name: string;
  isOnline: boolean;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarWithPresence({
  name,
  isOnline,
  size = "md",
  className,
}: AvatarWithPresenceProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  const dotPosition = {
    sm: "-bottom-0.5 -right-0.5",
    md: "bottom-0 right-0",
    lg: "bottom-0 right-0",
  };

  return (
    <div className={cn("relative inline-block shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold text-white",
          sizeClasses[size]
        )}
        style={{ backgroundColor: stringToColor(name) }}
      >
        {getInitials(name)}
      </div>
      <OnlineIndicator
        isOnline={isOnline}
        size={size === "lg" ? "md" : "sm"}
        className={dotPosition[size]}
      />
    </div>
  );
}