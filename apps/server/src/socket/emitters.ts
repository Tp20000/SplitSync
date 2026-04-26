// FILE: apps/server/src/socket/emitters.ts
// PURPOSE: Type-safe socket event emitters — call from any service
// DEPENDS ON: socket.io, socket types
// LAST UPDATED: F19 - Socket.io Server Setup

import { Server as SocketIOServer } from "socket.io";
import { ROOMS } from "./types";
import { logger } from "../shared/utils/logger";

// ─────────────────────────────────────────────
// Singleton io reference (set during bootstrap)
// ─────────────────────────────────────────────

let io: SocketIOServer | null = null;

export function setSocketServer(server: SocketIOServer): void {
  io = server;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

// ─────────────────────────────────────────────
// EXPENSE EVENTS
// ─────────────────────────────────────────────

export function emitExpenseCreated(
  groupId: string,
  expense: Record<string, unknown>,
  createdBy: string
): void {
  if (!io) {
    logger.warn("[Socket] emitExpenseCreated called but io is null");
    return;
  }

  const room = ROOMS.group(groupId);

  // Debug: check how many sockets are in the room
  const roomSockets = io.sockets.adapter.rooms.get(room);
  logger.info(
    `[Socket] emitExpenseCreated → room: ${room}, clients: ${roomSockets?.size ?? 0}`
  );

  io.to(room).emit("expense:created", {
    expense,
    groupId,
    createdBy,
  });
}

export function emitExpenseUpdated(
  groupId: string,
  expense: Record<string, unknown>,
  updatedBy: string
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("expense:updated", {
    expense,
    groupId,
    updatedBy,
  });

  logger.debug(`[Socket] expense:updated emitted to group ${groupId}`);
}

export function emitExpenseDeleted(
  groupId: string,
  expenseId: string,
  deletedBy: string
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("expense:deleted", {
    expenseId,
    groupId,
    deletedBy,
  });

  logger.debug(`[Socket] expense:deleted emitted to group ${groupId}`);
}

// ─────────────────────────────────────────────
// SETTLEMENT EVENTS
// ─────────────────────────────────────────────

export function emitSettlementCreated(
  groupId: string,
  settlement: Record<string, unknown>
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("settlement:created", {
    settlement,
    groupId,
  });

  logger.debug(
    `[Socket] settlement:created emitted to group ${groupId}`
  );
}

// ─────────────────────────────────────────────
// BALANCE EVENTS
// ─────────────────────────────────────────────

export function emitBalanceUpdated(groupId: string): void {
  if (!io) {
    logger.warn("[Socket] emitBalanceUpdated called but io is null");
    return;
  }

  const room = ROOMS.group(groupId);
  const roomSockets = io.sockets.adapter.rooms.get(room);
  logger.info(
    `[Socket] emitBalanceUpdated → room: ${room}, clients: ${roomSockets?.size ?? 0}`
  );

  io.to(room).emit("balance:updated", { groupId });
}

// ─────────────────────────────────────────────
// MEMBER EVENTS
// ─────────────────────────────────────────────

export function emitMemberJoined(
  groupId: string,
  userId: string,
  userName: string
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("member:joined", {
    groupId,
    userId,
    userName,
  });

  logger.debug(
    `[Socket] member:joined emitted to group ${groupId}`
  );
}

export function emitMemberLeft(
  groupId: string,
  userId: string,
  userName: string
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("member:left", {
    groupId,
    userId,
    userName,
  });

  logger.debug(
    `[Socket] member:left emitted to group ${groupId}`
  );
}

// ─────────────────────────────────────────────
// NOTIFICATION EVENTS (direct to user)
// ─────────────────────────────────────────────

export function emitNotification(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  if (!io) return;

  io.to(ROOMS.user(userId)).emit("notification:new", notification);

  logger.debug(
    `[Socket] notification:new emitted to user ${userId}`
  );
}

// ─────────────────────────────────────────────
// COMMENT EVENTS
// ─────────────────────────────────────────────

export function emitCommentCreated(
  groupId: string,
  expenseId: string,
  comment: {
    id: string;
    expenseId: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl: string | null;
    };
  }
): void {
  if (!io) return;

  io.to(ROOMS.group(groupId)).emit("comment:created", {
    groupId,
    expenseId,
    comment,
  });

  logger.debug(
    `[Socket] comment:created emitted to group ${groupId}`
  );
}

// ─────────────────────────────────────────────
// UTILITY: Get online users in a group
// ─────────────────────────────────────────────

export async function getOnlineUsersInGroup(
  groupId: string
): Promise<string[]> {
  if (!io) return [];

  const sockets = await io
    .in(ROOMS.group(groupId))
    .fetchSockets();

  // Extract unique user IDs
  const userIds = new Set<string>();
  for (const socket of sockets) {
    const authSocket = socket as unknown as { userId?: string };
    if (authSocket.userId) {
      userIds.add(authSocket.userId);
    }
  }

  return Array.from(userIds);
}