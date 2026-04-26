// FILE: apps/web/src/stores/socketStore.ts
// PURPOSE: Zustand store tracking socket connection state + online users
// DEPENDS ON: zustand, socket.ts
// LAST UPDATED: F20 - Socket.io Client Setup

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { OnlineUser } from "@/types/socket";

// ─────────────────────────────────────────────
// Store State
// ─────────────────────────────────────────────

interface SocketState {
  // Connection
  isConnected: boolean;
  socketId: string | null;
  connectionError: string | null;
  reconnectAttempt: number;

  // Online users per group: groupId → Set of userId
  onlineUsers: Record<string, Set<string>>;

  // User info map: userId → OnlineUser
  userInfo: Record<string, OnlineUser>;

  // Typing users per group: groupId → Set of userId
  typingUsers: Record<string, Set<string>>;

  // Actions
  setConnected: (socketId: string) => void;
  setDisconnected: () => void;
  setConnectionError: (error: string | null) => void;
  setReconnectAttempt: (attempt: number) => void;
  addOnlineUser: (groupId: string, user: OnlineUser) => void;
  removeOnlineUser: (groupId: string, userId: string) => void;
  setTyping: (
    groupId: string,
    userId: string,
    isTyping: boolean
  ) => void;
  clearGroupState: (groupId: string) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────

const initialState = {
  isConnected: false,
  socketId: null,
  connectionError: null,
  reconnectAttempt: 0,
  onlineUsers: {},
  userInfo: {},
  typingUsers: {},
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useSocketStore = create<SocketState>()(
  devtools(
    (set) => ({
      ...initialState,

      // ── Connection actions ──

      setConnected: (socketId) =>
        set(
          {
            isConnected: true,
            socketId,
            connectionError: null,
            reconnectAttempt: 0,
          },
          false,
          "socket/connected"
        ),

      setDisconnected: () =>
        set(
          {
            isConnected: false,
            socketId: null,
          },
          false,
          "socket/disconnected"
        ),

      setConnectionError: (error) =>
        set(
          { connectionError: error },
          false,
          "socket/error"
        ),

      setReconnectAttempt: (attempt) =>
        set(
          { reconnectAttempt: attempt },
          false,
          "socket/reconnecting"
        ),

      // ── Presence actions ──

      addOnlineUser: (groupId, user) =>
        set(
          (state) => {
            const groupUsers = new Set(
              state.onlineUsers[groupId] ?? []
            );
            groupUsers.add(user.userId);

            return {
              onlineUsers: {
                ...state.onlineUsers,
                [groupId]: groupUsers,
              },
              userInfo: {
                ...state.userInfo,
                [user.userId]: user,
              },
            };
          },
          false,
          "socket/userOnline"
        ),

      removeOnlineUser: (groupId, userId) =>
        set(
          (state) => {
            const groupUsers = new Set(
              state.onlineUsers[groupId] ?? []
            );
            groupUsers.delete(userId);

            return {
              onlineUsers: {
                ...state.onlineUsers,
                [groupId]: groupUsers,
              },
            };
          },
          false,
          "socket/userOffline"
        ),

      // ── Typing actions ──

      setTyping: (groupId, userId, isTyping) =>
        set(
          (state) => {
            const groupTyping = new Set(
              state.typingUsers[groupId] ?? []
            );

            if (isTyping) {
              groupTyping.add(userId);
            } else {
              groupTyping.delete(userId);
            }

            return {
              typingUsers: {
                ...state.typingUsers,
                [groupId]: groupTyping,
              },
            };
          },
          false,
          "socket/typing"
        ),

      // ── Clear group state on leave ──

      clearGroupState: (groupId) =>
        set(
          (state) => {
            const { [groupId]: _ou, ...restOnline } =
              state.onlineUsers;
            const { [groupId]: _tu, ...restTyping } =
              state.typingUsers;

            return {
              onlineUsers: restOnline,
              typingUsers: restTyping,
            };
          },
          false,
          "socket/clearGroup"
        ),

      // ── Reset all ──

      reset: () => set(initialState, false, "socket/reset"),
    }),
    {
      name: "splitsync-socket",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// ─────────────────────────────────────────────
// Selector hooks
// ─────────────────────────────────────────────

export const useIsSocketConnected = () =>
  useSocketStore((s) => s.isConnected);

export const useOnlineUsersInGroup = (groupId: string) =>
  useSocketStore((s) => s.onlineUsers[groupId] ?? new Set<string>());

export const useTypingUsersInGroup = (groupId: string) =>
  useSocketStore((s) => s.typingUsers[groupId] ?? new Set<string>());

export const useSocketId = () =>
  useSocketStore((s) => s.socketId);