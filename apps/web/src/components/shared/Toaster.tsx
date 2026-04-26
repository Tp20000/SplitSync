// FILE: apps/web/src/components/shared/Toaster.tsx
// PURPOSE: Renders all active toast notifications
// DEPENDS ON: useToastStore, framer-motion
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToastStore, type ToastVariant } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: React.ElementType;
    containerClass: string;
    iconClass: string;
  }
> = {
  default: {
    icon: Info,
    containerClass: "border-border bg-card",
    iconClass: "text-blue-500",
  },
  success: {
    icon: CheckCircle2,
    containerClass: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
    iconClass: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    containerClass: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
    iconClass: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    iconClass: "text-amber-600",
  },
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 sm:max-w-md w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant];
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="pointer-events-auto"
            >
              <div
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
                  config.containerClass
                )}
              >
                {/* Icon */}
                <Icon
                  size={18}
                  className={cn("shrink-0 mt-0.5", config.iconClass)}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}