// FILE: apps/web/src/app/page.tsx
// PURPOSE: Root entry point — middleware handles redirect
// LAST UPDATED: F47 Fix

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <LoadingScreen />;
}