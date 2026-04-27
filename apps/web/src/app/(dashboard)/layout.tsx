// FILE: apps/web/src/app/(dashboard)/layout.tsx
// PURPOSE: Dashboard layout with client-side auth guard
// LAST UPDATED: F47 Fix - Cross-domain cookie auth

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Navbar } from "@/components/shared/Navbar";
import { MobileNav } from "@/components/shared/MobileNav";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Only redirect if fully initialized AND not authenticated
    if (isInitialized && !isAuthenticated && !isLoading) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, isLoading, router]);

  // Show loading while auth is being determined
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Redirect handled by useEffect above
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-4 md:py-6 pb-mobile-nav">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <MobileNav />
    </div>
  );
}