// FILE: apps/web/src/app/(dashboard)/page.tsx
// PURPOSE: Root of dashboard group — redirect to /dashboard
// DEPENDS ON: next/navigation
// LAST UPDATED: F09 Fix - Dashboard Route

import { redirect } from "next/navigation";

export default function DashboardIndexPage() {
  redirect("/dashboard");
}