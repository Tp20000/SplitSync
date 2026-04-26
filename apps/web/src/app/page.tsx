// FILE: apps/web/src/app/page.tsx
// PURPOSE: Root page — redirects to dashboard or login
// DEPENDS ON: next/navigation
// LAST UPDATED: F07 - Next.js Frontend Setup

import { redirect } from "next/navigation";

export default function RootPage() {
  // Auth state check happens in middleware (F09)
  // For now redirect to login
  redirect("/login");
}