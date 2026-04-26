// FILE: apps/web/src/components/shared/ConnectionStatus.tsx
// PURPOSE: Small indicator showing real-time connection status
// DEPENDS ON: useSocketStatus, socketStore
// LAST UPDATED: F20 - Socket.io Client Setup

"use client";

import { useSocketStatus } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { isConnected, isReconnecting, reconnectAttempt } =
    useSocketStatus();

  if (isConnected) {
    return (
      <div
        className="flex items-center gap-1.5"
        title="Real-time connected"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Live
        </span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div
        className="flex items-center gap-1.5"
        title={`Reconnecting... (attempt ${reconnectAttempt})`}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Reconnecting...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5"
      title="Real-time disconnected"
    >
      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Offline
      </span>
    </div>
  );
}