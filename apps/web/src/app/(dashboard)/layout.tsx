// FILE: apps/web/src/app/(dashboard)/layout.tsx
// PURPOSE: Dashboard layout with auth guard + navbar
// LAST UPDATED: F47 Fix

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

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) return <LoadingScreen />;
  if (!isAuthenticated) return <LoadingScreen />;

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