// FILE: apps/web/src/app/(dashboard)/notifications/page.tsx
// PURPOSE: Full notifications page
// DEPENDS ON: useNotifications, useMarkAllAsRead
// LAST UPDATED: F29 - Notification System

"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useRealtimeNotifications,
} from "@/hooks/useNotifications";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

const TYPE_CONFIG: Record<
  string,
  { emoji: string; label: string }
> = {
  expense_created: { emoji: "💰", label: "New expense" },
  expense_updated: { emoji: "✏️", label: "Expense updated" },
  expense_deleted: { emoji: "🗑️", label: "Expense deleted" },
  settlement_received: { emoji: "✅", label: "Payment received" },
  comment_added: { emoji: "💬", label: "New comment" },
  member_joined: { emoji: "👋", label: "Member joined" },
  member_left: { emoji: "👋", label: "Member left" },
  payment_reminder: { emoji: "⏰", label: "Payment reminder" },
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications(1);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending } = useMarkAllAsRead();

  useRealtimeNotifications();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.meta?.unreadCount ?? 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllAsRead()}
            disabled={isPending}
          >
            <CheckCheck size={14} />
            Mark all read
          </Button>
        )}
      </div>

      <Separator />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <Bell
            className="mx-auto mb-3 text-muted-foreground"
            size={40}
          />
          <p className="font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You will be notified about expenses, settlements, and
            comments.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config =
              TYPE_CONFIG[notification.type] ?? {
                emoji: "🔔",
                label: "Notification",
              };

            const metadata = notification.metadata as Record<
              string,
              string
            > | null;
            const href = metadata?.groupId
              ? `/groups/${metadata.groupId}`
              : undefined;

            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-4 transition-colors",
                  !notification.isRead
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card"
                )}
              >
                {/* Emoji */}
                <div className="text-2xl shrink-0">
                  {config.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {href ? (
                    <Link href={href}>
                      <p
                        className={cn(
                          "text-sm",
                          !notification.isRead && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                    </Link>
                  ) : (
                    <p
                      className={cn(
                        "text-sm",
                        !notification.isRead && "font-semibold"
                      )}
                    >
                      {notification.title}
                    </p>
                  )}
                  {notification.body && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(notification.createdAt)} ·{" "}
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCheck size={12} />
                        Read
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}