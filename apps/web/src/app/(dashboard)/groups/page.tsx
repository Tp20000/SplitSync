// FILE: apps/web/src/app/(dashboard)/groups/page.tsx
// PURPOSE: Groups list page — shows all user groups
// DEPENDS ON: GroupList, CreateGroupModal, JoinGroupModal
// LAST UPDATED: F11 - Groups Frontend

import type { Metadata } from "next";
import { GroupList } from "@/components/groups/GroupList";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";

export const metadata: Metadata = {
  title: "Groups",
};

export default function GroupsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Your Groups
          </h1>
          <p className="text-muted-foreground">
            Manage your expense groups and track balances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <JoinGroupModal />
          <CreateGroupModal />
        </div>
      </div>

      {/* Groups Grid */}
      <GroupList />
    </div>
  );
}