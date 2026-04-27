// FILE: apps/web/src/app/(dashboard)/page.tsx
// PURPOSE: Root redirect to dashboard
// LAST UPDATED: F47 Fix

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}