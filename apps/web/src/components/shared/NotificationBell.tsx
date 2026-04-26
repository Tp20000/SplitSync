// FILE: apps/web/src/components/shared/NotificationBell.tsx
// PURPOSE: Navbar notification bell with unread badge + dropdown
// DEPENDS ON: useNotifications, useMarkAsRead, useRealtimeNotifications
// LAST UPDATED: F29 - Notification System

"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useRealtimeNotifications,
} from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

// ─────────────────────────────────────────────
// Notification type icons + labels
// ─────────────────────────────────────────────

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotifications(1);
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } =
    useMarkAllAsRead();

  // Wire real-time notifications
  useRealtimeNotifications();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.meta?.unreadCount ?? 0;

  const handleMarkOne = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAll = () => {
    markAllAsRead(undefined, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[480px] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between py-3">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
            >
              <CheckCheck size={12} />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-0" />

        {/* Notification list */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-2 text-muted-foreground" size={24} />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkOne}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-2 text-xs text-muted-foreground"
                asChild
              >
                <Link href="/notifications">
                  <ExternalLink size={12} />
                  View all notifications
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────
// Single notification item
// ─────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const config =
    TYPE_CONFIG[notification.type] ?? {
      emoji: "🔔",
      label: "Notification",
    };

  // Build link from metadata
  const metadata = notification.metadata as Record<
    string,
    string
  > | null;
  const href = metadata?.groupId
    ? `/groups/${metadata.groupId}`
    : undefined;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-3 hover:bg-muted/50 transition-colors",
        !notification.isRead && "bg-primary/5"
      )}
    >
      {/* Emoji */}
      <div className="shrink-0 text-lg mt-0.5">
        {config.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {href ? (
          <Link href={href} className="block">
            <p
              className={cn(
                "text-sm leading-snug line-clamp-2",
                !notification.isRead && "font-medium"
              )}
            >
              {notification.title}
            </p>
            {notification.body && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {notification.body}
              </p>
            )}
          </Link>
        ) : (
          <div>
            <p
              className={cn(
                "text-sm leading-snug line-clamp-2",
                !notification.isRead && "font-medium"
              )}
            >
              {notification.title}
            </p>
            {notification.body && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {notification.body}
              </p>
            )}
          </div>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Mark read button */}
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          title="Mark as read"
          onClick={(e) => {
            e.preventDefault();
            onMarkRead(notification.id);
          }}
        >
          <Check size={12} />
        </Button>
      )}

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1" />
      )}
    </div>
  );
}