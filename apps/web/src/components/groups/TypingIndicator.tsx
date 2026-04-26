// FILE: apps/web/src/components/groups/TypingIndicator.tsx
// PURPOSE: Shows animated "X is typing..." indicator for a group
// DEPENDS ON: socketStore, authStore
// LAST UPDATED: F23 - Typing Indicators

"use client";

import { useTypingUsersInGroup, useSocketStore } from "@/stores/socketStore";
import { useUser } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  groupId: string;
  className?: string;
}

export function TypingIndicator({
  groupId,
  className,
}: TypingIndicatorProps) {
  const typingUserIds = useTypingUsersInGroup(groupId);
  const userInfo = useSocketStore((s) => s.userInfo);
  const currentUser = useUser();

  // Filter out current user
  const otherTyping = Array.from(typingUserIds).filter(
    (id) => id !== currentUser?.id
  );

  if (otherTyping.length === 0) return null;

  // Build display text
  const names = otherTyping.map((id) => {
    const info = userInfo[id];
    return info?.userName?.split(" ")[0] ?? "Someone";
  });

  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing`;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground animate-fade-in",
        className
      )}
    >
      {/* Bouncing dots */}
      <span className="flex items-center gap-0.5">
        <BouncingDot delay={0} />
        <BouncingDot delay={150} />
        <BouncingDot delay={300} />
      </span>
      <span>{text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Bouncing dot animation
// ─────────────────────────────────────────────

function BouncingDot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
      style={{
        animation: `typing-bounce 1.2s ease-in-out ${delay}ms infinite`,
      }}
    />
  );
}