// FILE: apps/web/src/app/providers.tsx
// PURPOSE: Root providers — Query + Auth + Socket + Toaster
// DEPENDS ON: all providers
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";
import { AuthInitializer } from "@/components/shared/AuthInitializer";
import { SocketProvider } from "@/components/shared/SocketProvider";
import { Toaster } from "@/components/shared/Toaster";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer />
        <SocketProvider>
          {children}
        </SocketProvider>
        <Toaster />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}