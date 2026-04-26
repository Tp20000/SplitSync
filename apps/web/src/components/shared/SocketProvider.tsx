// FILE: apps/web/src/components/shared/SocketProvider.tsx
// PURPOSE: Manages socket lifecycle — connect on auth, disconnect on logout
// DEPENDS ON: socket.ts, socketStore, authStore
// LAST UPDATED: F21 Fix - Connection reliability

"use client";

import { useEffect, useRef } from "react";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket";
import { useSocketStore } from "@/stores/socketStore";
import { useAuthStore } from "@/stores/authStore";
import { getAccessToken } from "@/lib/axios";

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const {
    setConnected,
    setDisconnected,
    setConnectionError,
    setReconnectAttempt,
    addOnlineUser,
    removeOnlineUser,
    setTyping,
    reset,
  } = useSocketStore();

  const hasSetup = useRef(false);

  useEffect(() => {
    // Wait for auth
    if (!isInitialized) return;

    // Not authenticated — disconnect
    if (!isAuthenticated) {
      disconnectSocket();
      reset();
      hasSetup.current = false;
      return;
    }

    // Already setup
    if (hasSetup.current) return;

    // Need a token
    const token = getAccessToken();
    if (!token) {
      console.warn("[SocketProvider] No token yet, waiting...");
      return;
    }

    hasSetup.current = true;
    console.info("[SocketProvider] Setting up socket connection...");

    const socket = connectSocket();

    // ── Connection lifecycle ──

    socket.on("connect", () => {
      console.info("[SocketProvider] ✅ Connected:", socket.id);
      setConnected(socket.id ?? "");
    });

    socket.on("disconnect", (reason) => {
      console.info("[SocketProvider] Disconnected:", reason);
      setDisconnected();
    });

    socket.on("connect_error", (err) => {
      console.error("[SocketProvider] Connect error:", err.message);
      setConnectionError(err.message);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      setReconnectAttempt(attempt);
    });

    socket.io.on("reconnect", () => {
      setReconnectAttempt(0);
      setConnectionError(null);
    });

    socket.io.on("reconnect_failed", () => {
      setConnectionError("Unable to reconnect");
    });

    // ── Presence ──

    socket.on("user:online", (data) => {
      addOnlineUser(data.groupId, {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on("user:offline", (data) => {
      removeOnlineUser(data.groupId, data.userId);
    });

    // ── Typing ──

    socket.on("user:typing", (data) => {
      setTyping(data.groupId, data.userId, data.isTyping);
    });

    // ── Error ──

    socket.on("error", (data) => {
      console.error("[SocketProvider] Server error:", data.message);
    });

    // ── Connect! ──
    console.info("[SocketProvider] Calling socket.connect()...");
    socket.connect();

    // ── Presence ping ──
    const pingInterval = setInterval(() => {
      const s = getSocket();
      if (s?.connected) {
        s.emit("presence:ping");
      }
    }, 60000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [
    isAuthenticated,
    isInitialized,
    setConnected,
    setDisconnected,
    setConnectionError,
    setReconnectAttempt,
    addOnlineUser,
    removeOnlineUser,
    setTyping,
    reset,
  ]);

  return <>{children}</>;
}