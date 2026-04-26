// FILE: apps/web/src/components/shared/ErrorBoundary.tsx
// PURPOSE: Catches React rendering errors — shows fallback UI
// DEPENDS ON: react
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = (): void => {
    window.location.href = "/dashboard";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle
                  size={24}
                  className="text-destructive"
                />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. This has been logged
                and we&apos;ll look into it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Error details (dev only) */}
              {process.env.NODE_ENV === "development" &&
                this.state.error && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs font-mono text-destructive break-words">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

              {/* Actions */}
              <div className="flex items-center gap-2 justify-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={this.handleRetry}
                >
                  <RefreshCw size={14} />
                  Try again
                </Button>
                <Button
                  className="gap-2"
                  onClick={this.handleGoHome}
                >
                  <Home size={14} />
                  Go home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}