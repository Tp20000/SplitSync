// FILE: apps/web/src/components/shared/LiveActivityToast.tsx
// PURPOSE: Shows toast-like notifications for live group activity
// DEPENDS ON: useSocketEvent, framer-motion
// LAST UPDATED: F21 - Real-Time Expense Sync

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, UserPlus, UserMinus, X } from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { useUser } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  message: string;
  timestamp: number;
}

interface LiveActivityToastProps {
  groupId: string;
}

export function LiveActivityToast({
  groupId,
}: LiveActivityToastProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const currentUser = useUser();

  const addActivity = useCallback(
    (icon: React.ReactNode, message: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setActivities((prev) => [
        { id, icon, message, timestamp: Date.now() },
        ...prev.slice(0, 2), // Keep max 3
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setActivities((prev) => prev.filter((a) => a.id !== id));
      }, 5000);
    },
    []
  );

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // ── expense:created ──
  useSocketEvent(
    "expense:created",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.createdBy === currentUser?.id) return;

        const expense = data.expense as {
          title?: string;
          totalAmount?: string;
          currency?: string;
          paidByUser?: { name?: string };
        };

        const name =
          expense.paidByUser?.name?.split(" ")[0] ?? "Someone";
        const amount = expense.totalAmount
          ? formatCurrency(expense.totalAmount, expense.currency ?? "INR")
          : "";

        addActivity(
          <Receipt size={14} className="text-blue-500" />,
          `${name} added "${expense.title ?? "expense"}" ${amount}`
        );
      },
      [groupId, currentUser?.id, addActivity]
    ),
    !!groupId
  );

  // ── expense:deleted ──
  useSocketEvent(
    "expense:deleted",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.deletedBy === currentUser?.id) return;

        addActivity(
          <Receipt size={14} className="text-red-500" />,
          "An expense was deleted"
        );
      },
      [groupId, currentUser?.id, addActivity]
    ),
    !!groupId
  );

  // ── member:joined ──
  useSocketEvent(
    "member:joined",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.userId === currentUser?.id) return;

        addActivity(
          <UserPlus size={14} className="text-green-500" />,
          `${data.userName.split(" ")[0]} joined the group`
        );
      },
      [groupId, currentUser?.id, addActivity]
    ),
    !!groupId
  );

  // ── member:left ──
  useSocketEvent(
    "member:left",
    useCallback(
      (data) => {
        if (data.groupId !== groupId) return;
        if (data.userId === currentUser?.id) return;

        addActivity(
          <UserMinus size={14} className="text-amber-500" />,
          `${data.userName.split(" ")[0]} left the group`
        );
      },
      [groupId, currentUser?.id, addActivity]
    ),
    !!groupId
  );

  if (activities.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg max-w-xs"
          >
            {activity.icon}
            <p className="flex-1 text-sm">{activity.message}</p>
            <button
              onClick={() => removeActivity(activity.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}