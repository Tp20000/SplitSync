// FILE: apps/web/src/hooks/useToast.ts
// PURPOSE: Toast notification state management
// DEPENDS ON: react
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

import { useState, useCallback, useEffect } from "react";
import { create } from "zustand";

// ─────────────────────────────────────────────
// Toast types
// ─────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

// ─────────────────────────────────────────────
// Toast store
// ─────────────────────────────────────────────

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast].slice(-5), // Max 5 toasts
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, toast.duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAll: () => set({ toasts: [] }),
}));

// ─────────────────────────────────────────────
// Convenience hook
// ─────────────────────────────────────────────

export function useToast() {
  const { addToast } = useToastStore();

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 5000,
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      addToast({ title, description, variant, duration });
    },
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "success" });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "error", duration: 7000 });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "warning" });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast({ title, description, variant: "default" });
    },
    [toast]
  );

  return { toast, success, error, warning, info };
}