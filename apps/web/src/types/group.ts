// FILE: apps/web/src/types/group.ts
// PURPOSE: TypeScript types for groups across frontend
// DEPENDS ON: none
// LAST UPDATED: F11 - Groups Frontend

export type GroupType =
  | "general"
  | "trip"
  | "home"
  | "couple"
  | "event"
  | "other";

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: "admin" | "member";
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    currencyPref: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: GroupType;
  coverImage: string | null;
  inviteCode: string;
  createdBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  expenseCount?: number;
  userRole: "admin" | "member";
  joinedAt?: string;
  members?: GroupMember[];
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  type: GroupType;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  type?: GroupType;
}