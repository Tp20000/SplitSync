// FILE: apps/web/src/app/error.tsx
// PURPOSE: Next.js app-level error page
// DEPENDS ON: next
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorPage]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle size={32} className="text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">
            Something went wrong
          </h1>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-mono text-destructive break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-2" onClick={reset}>
            <RefreshCw size={14} />
            Try again
          </Button>
          <Button
            className="gap-2"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home size={14} />
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}