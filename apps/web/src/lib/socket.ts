// FILE: apps/web/src/lib/socket.ts
// PURPOSE: Socket.io client singleton with JWT auth
// DEPENDS ON: socket.io-client, getAccessToken
// LAST UPDATED: F21 Fix - Connection reliability

import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/types/socket";
import { getAccessToken } from "@/lib/axios";

export type TypedSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

let socket: TypedSocket | null = null;

// Use the same port as backend — NOT the Next.js proxy
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export function getSocket(): TypedSocket | null {
  return socket;
}

export function connectSocket(): TypedSocket {
  const token = getAccessToken();

  if (!token) {
    console.warn("[Socket] No access token — cannot connect");
    // Return existing socket or create a dummy
    if (socket) return socket;
  }

  // Already connected with same token
  if (socket?.connected) {
    return socket;
  }

  // Disconnect old socket if exists
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  console.info("[Socket] Creating new connection to", SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 15,
    timeout: 20000,
    autoConnect: false,
    // Force new connection — don't reuse
    forceNew: true,
  }) as TypedSocket;

  // Debug logging
  socket.on("connect", () => {
    console.info("[Socket] ✅ Connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] ❌ Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.info("[Socket] Disconnected:", reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    console.info("[Socket] Disconnecting...");
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function updateSocketAuth(token: string): void {
  if (socket) {
    socket.auth = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
}