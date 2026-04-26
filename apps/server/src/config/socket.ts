// FILE: apps/server/src/config/socket.ts
// PURPOSE: Socket.io server creation + JWT auth middleware
// DEPENDS ON: socket.io, jsonwebtoken, env
// LAST UPDATED: F19 - Socket.io Server Setup

import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "./env";

// ─────────────────────────────────────────────
// Extended socket type with user data
// ─────────────────────────────────────────────

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userName: string;
  userEmail: string;
}

// ─────────────────────────────────────────────
// JWT payload shape (matches auth.service.ts)
// ─────────────────────────────────────────────

interface JwtAccessPayload {
  id: string;
  email: string;
  name: string;
}

// ─────────────────────────────────────────────
// Create Socket.io server
// ─────────────────────────────────────────────

export function createSocketServer(
  httpServer: HTTPServer
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        env.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  // ─── JWT Authentication Middleware ───
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET,
        {
          issuer: "splitsync",
          audience: "splitsync-client",
        }
      ) as JwtAccessPayload;

      // Attach user data to socket
      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = payload.id;
      authSocket.userName = payload.name;
      authSocket.userEmail = payload.email;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  return io;
}