// FILE: apps/web/src/app/not-found.tsx
// PURPOSE: Custom 404 page
// DEPENDS ON: next
// LAST UPDATED: F40 - Error Boundary + Toast Notifications

import Link from "next/link";
import { FileSearch, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileSearch size={32} className="text-muted-foreground" />
        </div>

        <div>
          <h1 className="text-6xl font-bold text-muted-foreground/50">
            404
          </h1>
          <h2 className="mt-2 text-xl font-semibold">
            Page not found
          </h2>
          <p className="mt-2 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or
            has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <ArrowLeft size={14} />
              Go back
            </Link>
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/dashboard">
              <Home size={14} />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}