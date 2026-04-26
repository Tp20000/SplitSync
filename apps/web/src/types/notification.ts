// FILE: apps/web/src/types/notification.ts
// PURPOSE: TypeScript types for notifications
// DEPENDS ON: none
// LAST UPDATED: F29 - Notification System

export type NotificationType =
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "settlement_received"
  | "comment_added"
  | "member_joined"
  | "member_left"
  | "payment_reminder";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  unreadCount: number;
}