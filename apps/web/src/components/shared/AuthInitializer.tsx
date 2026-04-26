// FILE: apps/web/src/components/shared/AuthInitializer.tsx
// PURPOSE: Silently restores session on app load via refresh token cookie
// DEPENDS ON: authStore
// LAST UPDATED: F12 Fix - Graceful refresh failure

"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthInitializer() {
  const { initializeAuth, isInitialized } = useAuthStore();
  // Use ref to prevent double-call in React StrictMode
  const initialized = useRef(false);

  useEffect(() => {
    if (!isInitialized && !initialized.current) {
      initialized.current = true;
      void initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  return null;
}