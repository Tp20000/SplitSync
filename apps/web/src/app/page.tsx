// FILE: apps/web/src/app/page.tsx
// PURPOSE: Root page redirect
// LAST UPDATED: F47 Fix

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}