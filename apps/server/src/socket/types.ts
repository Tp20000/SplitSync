// FILE: apps/server/src/socket/types.ts
// PURPOSE: All Socket.io event types — single source of truth
// DEPENDS ON: none
// LAST UPDATED: F19 - Socket.io Server Setup

// ─────────────────────────────────────────────
// Server → Client events
// ─────────────────────────────────────────────

export interface ServerToClientEvents {
  // Expenses
  "expense:created": (data: {
    expense: Record<string, unknown>;
    groupId: string;
    createdBy: string;
  }) => void;

  "expense:updated": (data: {
    expense: Record<string, unknown>;
    groupId: string;
    updatedBy: string;
  }) => void;

  "expense:deleted": (data: {
    expenseId: string;
    groupId: string;
    deletedBy: string;
  }) => void;

  // Settlements
  "settlement:created": (data: {
    settlement: Record<string, unknown>;
    groupId: string;
  }) => void;

  // Balances
  "balance:updated": (data: {
    groupId: string;
  }) => void;

  // Members
  "member:joined": (data: {
    groupId: string;
    userId: string;
    userName: string;
  }) => void;

  "member:left": (data: {
    groupId: string;
    userId: string;
    userName: string;
  }) => void;

  // Notifications
  "notification:new": (data: {
    id: string;
    type: string;
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
  }) => void;

  // Presence
  "user:online": (data: {
    userId: string;
    userName: string;
    groupId: string;
  }) => void;

  "user:offline": (data: {
    userId: string;
    groupId: string;
  }) => void;

  // Typing
  "user:typing": (data: {
    userId: string;
    userName: string;
    groupId: string;
    isTyping: boolean;
  }) => void;

    // Comments
  "comment:created": (data: {
    groupId: string;
    expenseId: string;
    comment: {
      id: string;
      expenseId: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
    };
  }) => void;

  // Error
  "error": (data: { message: string }) => void;
}

// ─────────────────────────────────────────────
// Client → Server events
// ─────────────────────────────────────────────

export interface ClientToServerEvents {
  // Room management
  "group:join": (
    data: { groupId: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;

  "group:leave": (
    data: { groupId: string },
    callback?: (response: { success: boolean }) => void
  ) => void;

  // Typing indicators
  "typing:start": (data: { groupId: string }) => void;
  "typing:stop": (data: { groupId: string }) => void;

  // Presence
  "presence:ping": () => void;
}

// ─────────────────────────────────────────────
// Room naming conventions
// ─────────────────────────────────────────────

export const ROOMS = {
  group: (groupId: string) => `group:${groupId}`,
  user: (userId: string) => `user:${userId}`,
} as const;