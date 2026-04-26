// FILE: apps/web/src/hooks/useSocket.ts
// PURPOSE: Hooks for socket event listening + emitting in components
// DEPENDS ON: socket.ts, socketStore
// LAST UPDATED: F20 - Socket.io Client Setup

"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket";

// ─────────────────────────────────────────────
// Listen to a socket event
// Automatically removes listener on unmount
// ─────────────────────────────────────────────

export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
  enabled = true
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const isConnected = useSocketStore((s) => s.isConnected);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const socket = getSocket();
    if (!socket) {
      console.warn(`[useSocketEvent] No socket for event: ${event}`);
      return;
    }

    console.debug(`[useSocketEvent] Listening: ${event}`);

    const stableHandler = (
      ...args: Parameters<ServerToClientEvents[K]>
    ) => {
      console.debug(`[useSocketEvent] Received: ${event}`, args[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (handlerRef.current as (...a: any[]) => void)(...args);
    };

    socket.on(event, stableHandler as never);

    return () => {
      console.debug(`[useSocketEvent] Removing listener: ${event}`);
      socket.off(event, stableHandler as never);
    };
  }, [event, enabled, isConnected]);
}

// ─────────────────────────────────────────────
// Emit a socket event
// ─────────────────────────────────────────────

export function useSocketEmit() {
  const isConnected = useSocketStore((s) => s.isConnected);

  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => {
      const socket = getSocket();
      if (!socket || !isConnected) {
        console.warn(
          `[Socket] Cannot emit ${event} — not connected`
        );
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket.emit as (...a: any[]) => void)(event, ...args);
    },
    [isConnected]
  );

  return { emit, isConnected };
}

// ─────────────────────────────────────────────
// Hook to join/leave a group room
// Auto-joins on mount, auto-leaves on unmount
// ─────────────────────────────────────────────

export function useGroupRoom(groupId: string | undefined): void {
  const { emit } = useSocketEmit();

  useEffect(() => {
    if (!groupId) return;

    // Join room
    emit("group:join", { groupId }, (response) => {
      if (!response?.success) {
        console.warn(
          `[Socket] Failed to join group room: ${groupId}`
        );
      }
    });

    // Leave room on cleanup
    return () => {
      emit("group:leave", { groupId });
    };
  }, [groupId, emit]);
}

// ─────────────────────────────────────────────
// Typing indicator hook
// ─────────────────────────────────────────────

export function useTypingIndicator(groupId: string | undefined) {
  const { emit } = useSocketEmit();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(() => {
    if (!groupId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    emit("typing:start", { groupId });

    // Auto-stop after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      emit("typing:stop", { groupId });
    }, 3000);
  }, [groupId, emit]);

  const stopTyping = useCallback(() => {
    if (!groupId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emit("typing:stop", { groupId });
  }, [groupId, emit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping };
}

// ─────────────────────────────────────────────
// Connection status hook
// ─────────────────────────────────────────────

export function useSocketStatus() {
  const isConnected = useSocketStore((s) => s.isConnected);
  const socketId = useSocketStore((s) => s.socketId);
  const connectionError = useSocketStore((s) => s.connectionError);
  const reconnectAttempt = useSocketStore(
    (s) => s.reconnectAttempt
  );

  return {
    isConnected,
    socketId,
    connectionError,
    reconnectAttempt,
    isReconnecting: reconnectAttempt > 0,
  };
}

// ─────────────────────────────────────────────
// Online users in a group
// ─────────────────────────────────────────────

export function useOnlineUsers(groupId: string) {
  const onlineUserIds = useSocketStore(
    (s) => s.onlineUsers[groupId] ?? new Set<string>()
  );
  const userInfo = useSocketStore((s) => s.userInfo);

  return {
    onlineUserIds,
    count: onlineUserIds.size,
    isUserOnline: (userId: string) => onlineUserIds.has(userId),
    getUserInfo: (userId: string) => userInfo[userId],
  };
}