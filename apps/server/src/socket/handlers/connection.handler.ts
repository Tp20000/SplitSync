// FILE: apps/server/src/socket/handlers/connection.handler.ts
// PURPOSE: Handles socket connection, auto-join rooms, track online
// DEPENDS ON: prisma, redis, socket types
// LAST UPDATED: F21 Fix - Room joining debug

import { Server as SocketIOServer } from "socket.io";
import type { AuthenticatedSocket } from "../../config/socket";
import { ROOMS } from "../types";
import prisma from "../../config/database";
import { cacheSet, cacheDel } from "../../config/redis";
import { logger } from "../../shared/utils/logger";

const ONLINE_KEY = (userId: string) => `online:${userId}`;
const ONLINE_TTL = 300;

export async function handleConnection(
  socket: AuthenticatedSocket,
  io: SocketIOServer
): Promise<void> {
  const { userId, userName } = socket;

  logger.info(
    `[Socket] Connected: ${userName} (${userId}) | socket: ${socket.id}`
  );

  try {
    // 1. Join personal room
    const userRoom = ROOMS.user(userId);
    await socket.join(userRoom);
    logger.info(`[Socket] ${userName} joined room: ${userRoom}`);

    // 2. Auto-join ALL group rooms
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    for (const membership of memberships) {
      const roomName = ROOMS.group(membership.groupId);
      await socket.join(roomName);
      logger.info(`[Socket] ${userName} joined room: ${roomName}`);
    }

    logger.info(
      `[Socket] ${userName} is in ${socket.rooms.size} rooms: ${Array.from(socket.rooms).join(", ")}`
    );

    // 3. Mark online
    await cacheSet(
      ONLINE_KEY(userId),
      { socketId: socket.id, userName },
      ONLINE_TTL
    );

    // 4. Notify groups
    for (const membership of memberships) {
      socket.to(ROOMS.group(membership.groupId)).emit("user:online", {
        userId,
        userName,
        groupId: membership.groupId,
      });
    }

    // 5. Disconnect handler
    socket.on("disconnect", async (reason) => {
      logger.info(
        `[Socket] Disconnected: ${userName} (${userId}) | reason: ${reason}`
      );

      await cacheDel(ONLINE_KEY(userId));

      for (const membership of memberships) {
        socket.to(ROOMS.group(membership.groupId)).emit("user:offline", {
          userId,
          groupId: membership.groupId,
        });
      }
    });

    // 6. Presence ping
    socket.on("presence:ping", async () => {
      await cacheSet(
        ONLINE_KEY(userId),
        { socketId: socket.id, userName },
        ONLINE_TTL
      );
    });
  } catch (err) {
    const error = err as Error;
    logger.error(`[Socket] Connection setup failed for ${userName}:`, {
      message: error.message,
    });
    socket.emit("error", { message: "Connection setup failed" });
  }
}