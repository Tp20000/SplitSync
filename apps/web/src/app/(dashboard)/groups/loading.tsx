// FILE: apps/web/src/app/(dashboard)/groups/loading.tsx
// PURPOSE: Loading state for groups page
// LAST UPDATED: F41

import { GroupsListSkeleton } from "@/components/shared/PageSkeleton";

export default function GroupsLoading() {
  return <GroupsListSkeleton />;
}