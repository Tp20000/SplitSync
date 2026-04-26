// FILE: apps/web/src/types/activity.ts
// PURPOSE: TypeScript types for activity feed
// DEPENDS ON: none
// LAST UPDATED: F37 - Activity Feed

export type ActivityType =
  | "expense_paid"
  | "expense_split"
  | "settlement_paid"
  | "settlement_received"
  | "group_joined";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount: string | null;
  currency: string | null;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}