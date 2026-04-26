// FILE: apps/web/src/app/(dashboard)/loading.tsx
// PURPOSE: Instant loading feedback for dashboard routes
// DEPENDS ON: Skeleton
// LAST UPDATED: F41 - Loading Skeletons

import { DashboardSkeleton } from "@/components/shared/PageSkeleton";

export default function DashboardLoading() {
  return <DashboardSkeleton />;
}