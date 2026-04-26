// FILE: apps/server/src/modules/notifications/notification.service.ts
// PURPOSE: Notification CRUD — list, mark read, mark all read
// DEPENDS ON: prisma, ApiError
// LAST UPDATED: F29 - Notification System

import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";

// ─────────────────────────────────────────────
// GET NOTIFICATIONS (paginated)
// ─────────────────────────────────────────────

export async function getNotifications(
  userId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    notifications,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      unreadCount,
    },
  };
}

// ─────────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

// ─────────────────────────────────────────────
// MARK ONE AS READ
// ─────────────────────────────────────────────

export async function markAsRead(
  userId: string,
  notificationId: string
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification) {
    throw ApiError.notFound("Notification");
  }

  if (notification.userId !== userId) {
    throw ApiError.forbidden(
      "This notification does not belong to you",
      ErrorCode.FORBIDDEN
    );
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// ─────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────

export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { updated: result.count };
}

// ─────────────────────────────────────────────
// DELETE OLD NOTIFICATIONS (housekeeping)
// Keeps last 100 per user
// ─────────────────────────────────────────────

export async function deleteOldNotifications(
  userId: string
): Promise<void> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 100,
    select: { id: true },
  });

  if (notifications.length > 0) {
    await prisma.notification.deleteMany({
      where: {
        id: { in: notifications.map((n) => n.id) },
      },
    });
  }
}