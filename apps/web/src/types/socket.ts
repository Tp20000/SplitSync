// FILE: apps/web/src/types/socket.ts
// PURPOSE: Frontend socket event type definitions — mirrors server types
// DEPENDS ON: none
// LAST UPDATED: F20 - Socket.io Client Setup

// ─────────────────────────────────────────────
// Server → Client events (what we listen to)
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
// Client → Server events (what we emit)
// ─────────────────────────────────────────────

export interface ClientToServerEvents {
  "group:join": (
    data: { groupId: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;

  "group:leave": (
    data: { groupId: string },
    callback?: (response: { success: boolean }) => void
  ) => void;

  "typing:start": (data: { groupId: string }) => void;
  "typing:stop": (data: { groupId: string }) => void;
  "presence:ping": () => void;
}

// ─────────────────────────────────────────────
// Online user info
// ─────────────────────────────────────────────

export interface OnlineUser {
  userId: string;
  userName: string;
}