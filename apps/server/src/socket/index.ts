// FILE: apps/server/src/socket/index.ts
// PURPOSE: Bootstraps Socket.io — connects handlers + stores io reference
// DEPENDS ON: socket.io, connection.handler, group.handler, emitters
// LAST UPDATED: F19 - Socket.io Server Setup

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { createSocketServer, type AuthenticatedSocket } from "../config/socket";
import { handleConnection } from "./handlers/connection.handler";
import { registerGroupHandlers } from "./handlers/group.handler";
import { setSocketServer } from "./emitters";
import { logger } from "../shared/utils/logger";

// ─────────────────────────────────────────────
// Initialize Socket.io
// ─────────────────────────────────────────────

export function initializeSocket(
  httpServer: HTTPServer
): SocketIOServer {
  const io = createSocketServer(httpServer);

  // Store reference for emitters
  setSocketServer(io);

  // ── Connection handler ──
  io.on("connection", async (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    // 1. Handle connection setup (auto-join rooms, track online)
    await handleConnection(authSocket, io);

    // 2. Register group-specific event handlers
    registerGroupHandlers(authSocket);
  });

  // ── Monitor connections ──
  const logConnections = () => {
    const count = io.engine.clientsCount;
    logger.debug(`[Socket] Active connections: ${count}`);
  };

  // Log connection count every 60 seconds
  setInterval(logConnections, 60000);

  logger.info("[Socket] Socket.io server initialized");

  return io;
}

// ─────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────

export async function shutdownSocket(
  io: SocketIOServer
): Promise<void> {
  return new Promise((resolve) => {
    io.close(() => {
      logger.info("[Socket] Socket.io server closed");
      resolve();
    });
  });
}