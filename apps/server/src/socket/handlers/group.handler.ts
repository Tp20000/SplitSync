// FILE: apps/server/src/socket/handlers/group.handler.ts
// PURPOSE: Handles explicit group room join/leave + typing indicators
// DEPENDS ON: prisma, socket types
// LAST UPDATED: F19 - Socket.io Server Setup

import type { AuthenticatedSocket } from "../../config/socket";
import { ROOMS } from "../types";
import prisma from "../../config/database";
import { logger } from "../../shared/utils/logger";

// ─────────────────────────────────────────────
// Register group-related socket handlers
// ─────────────────────────────────────────────

export function registerGroupHandlers(
  socket: AuthenticatedSocket
): void {
  const { userId, userName } = socket;

  // ── Join a group room (explicit) ──
  socket.on("group:join", async (data, callback) => {
    try {
      const { groupId } = data;

      // Verify membership
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId },
        },
        select: { id: true },
      });

      if (!member) {
        callback?.({ success: false, error: "Not a group member" });
        return;
      }

      await socket.join(ROOMS.group(groupId));

      logger.debug(
        `[Socket] ${userName} explicitly joined room: ${ROOMS.group(groupId)}`
      );

      // Notify others
      socket.to(ROOMS.group(groupId)).emit("user:online", {
        userId,
        userName,
        groupId,
      });

      callback?.({ success: true });
    } catch (err) {
      const error = err as Error;
      logger.error(`[Socket] group:join error:`, {
        message: error.message,
      });
      callback?.({ success: false, error: "Failed to join room" });
    }
  });

  // ── Leave a group room (explicit) ──
  socket.on("group:leave", async (data, callback) => {
    try {
      const { groupId } = data;

      await socket.leave(ROOMS.group(groupId));

      logger.debug(
        `[Socket] ${userName} left room: ${ROOMS.group(groupId)}`
      );

      // Notify others
      socket.to(ROOMS.group(groupId)).emit("user:offline", {
        userId,
        groupId,
      });

      callback?.({ success: true });
    } catch (err) {
      const error = err as Error;
      logger.error(`[Socket] group:leave error:`, {
        message: error.message,
      });
      callback?.({ success: false });
    }
  });

  // ── Typing indicators ──
  socket.on("typing:start", (data) => {
    socket.to(ROOMS.group(data.groupId)).emit("user:typing", {
      userId,
      userName,
      groupId: data.groupId,
      isTyping: true,
    });
  });

  socket.on("typing:stop", (data) => {
    socket.to(ROOMS.group(data.groupId)).emit("user:typing", {
      userId,
      userName,
      groupId: data.groupId,
      isTyping: false,
    });
  });
}