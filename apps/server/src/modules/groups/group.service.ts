// FILE: apps/server/src/modules/groups/group.service.ts
// PURPOSE: All group business logic — CRUD, join, leave, members
// DEPENDS ON: prisma, ApiError, redis cache, crypto
// LAST UPDATED: F12 - Group Members API + UI

import crypto from "crypto";
import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { calculateGroupBalances } from "../expenses/balance.service";
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
} from "../../config/redis";
import type {
  CreateGroupInput,
  UpdateGroupInput,
} from "./group.validation";
import {
  emitMemberJoined,
  emitMemberLeft,
} from "../../socket/emitters";
import { addNotificationJob } from "../../config/queue";

// ─────────────────────────────────────────────
// Cache keys
// ─────────────────────────────────────────────

const CACHE_KEYS = {
  group: (id: string) => `group:${id}`,
  userGroups: (userId: string) => `user:${userId}:groups`,
  groupMembers: (groupId: string) => `group:${groupId}:members`,
  membership: (groupId: string, userId: string) =>
    `membership:${groupId}:${userId}`,
};

// ─────────────────────────────────────────────
// Generate unique 8-char invite code
// ─────────────────────────────────────────────

async function generateUniqueInviteCode(): Promise<string> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = crypto
      .randomBytes(6)
      .toString("base64")
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 8)
      .padEnd(8, "A");

    const existing = await prisma.group.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });

    if (!existing) return code;
  }

  throw ApiError.internal("Failed to generate unique invite code");
}

// ─────────────────────────────────────────────
// HELPER: Assert group membership
// ─────────────────────────────────────────────

async function assertGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }
}

// ─────────────────────────────────────────────
// HELPER: Assert group admin role
// ─────────────────────────────────────────────

async function assertGroupAdmin(
  groupId: string,
  userId: string
): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });

  if (!member) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  if (member.role !== "admin") {
    throw ApiError.forbidden(
      "Only group admins can perform this action",
      ErrorCode.NOT_GROUP_ADMIN
    );
  }
}

// ─────────────────────────────────────────────
// CREATE GROUP
// ─────────────────────────────────────────────

export async function createGroup(
  userId: string,
  input: CreateGroupInput
) {
  const inviteCode = await generateUniqueInviteCode();

  const group = await prisma.$transaction(async (tx) => {
    const newGroup = await tx.group.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type ?? "general",
        coverImage: input.coverImage,
        inviteCode,
        createdBy: userId,
      },
    });

    await tx.groupMember.create({
      data: {
        groupId: newGroup.id,
        userId,
        role: "admin",
      },
    });

    return newGroup;
  });

  await cacheDel(CACHE_KEYS.userGroups(userId));

  return {
    ...group,
    memberCount: 1,
    userRole: "admin",
  };
}

// ─────────────────────────────────────────────
// GET USER'S GROUPS
// ─────────────────────────────────────────────

export async function getUserGroups(userId: string) {
  const cacheKey = CACHE_KEYS.userGroups(userId);
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: {
            select: {
              members: true,
              expenses: {
                where: { isDeleted: false },
              },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    type: m.group.type,
    coverImage: m.group.coverImage,
    inviteCode: m.group.inviteCode,
    isArchived: m.group.isArchived,
    createdBy: m.group.createdBy,
    createdAt: m.group.createdAt,
    updatedAt: m.group.updatedAt,
    memberCount: m.group._count.members,
    expenseCount: m.group._count.expenses,
    userRole: m.role,
    joinedAt: m.joinedAt,
  }));

  await cacheSet(cacheKey, groups, 120);
  return groups;
}

// ─────────────────────────────────────────────
// GET SINGLE GROUP
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GET SINGLE GROUP
// ─────────────────────────────────────────────

export async function getGroupById(
  groupId: string,
  userId: string
) {
  // Don't use cache for detail — needs fresh member count
  const found = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: {
          expenses: { where: { isDeleted: false } },
          settlements: true,
          members: true,
        },
      },
    },
  });

  if (!found) {
    throw ApiError.notFound("Group");
  }

  // Verify user is a member
  const userMembership = found.members.find(
    (m) => m.user.id === userId
  );

  if (!userMembership) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  return {
    id: found.id,
    name: found.name,
    description: found.description,
    type: found.type,
    coverImage: found.coverImage,
    inviteCode: found.inviteCode,
    createdBy: found.createdBy,
    isArchived: found.isArchived,
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
    // ← These are the key fields
    memberCount: found._count.members,
    expenseCount: found._count.expenses,
    members: found.members,
    userRole: userMembership.role as "admin" | "member",
  };
}

// ─────────────────────────────────────────────
// UPDATE GROUP (admin only)
// ─────────────────────────────────────────────

export async function updateGroup(
  groupId: string,
  userId: string,
  input: UpdateGroupInput
) {
  await assertGroupAdmin(groupId, userId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.type && { type: input.type }),
      ...(input.coverImage !== undefined && {
        coverImage: input.coverImage,
      }),
    },
  });

  await cacheDel(CACHE_KEYS.group(groupId));
  await cacheDel(CACHE_KEYS.userGroups(userId));

  return updated;
}

// ─────────────────────────────────────────────
// ARCHIVE GROUP (admin only)
// ─────────────────────────────────────────────

export async function archiveGroup(
  groupId: string,
  userId: string
) {
  await assertGroupAdmin(groupId, userId);

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { isArchived: true },
  });

  await cacheDel(CACHE_KEYS.group(groupId));
  await cacheDelPattern(`user:*:groups`);

  return updated;
}

// ─────────────────────────────────────────────
// JOIN GROUP via invite code
// ─────────────────────────────────────────────

export async function joinGroup(
  userId: string,
  inviteCode: string
) {
  const group = await prisma.group.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    select: {
      id: true,
      name: true,
      isArchived: true,
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    throw ApiError.badRequest(
      "Invalid invite code. Please check and try again.",
      ErrorCode.INVALID_INVITE_CODE
    );
  }

  if (group.isArchived) {
    throw ApiError.badRequest(
      "This group has been archived and is no longer accepting members.",
      ErrorCode.INVALID_INVITE_CODE
    );
  }

  const existing = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId },
    },
  });

  if (existing) {
    throw ApiError.conflict(
      "You are already a member of this group",
      ErrorCode.ALREADY_GROUP_MEMBER
    );
  }

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: "member",
    },
  });

  await cacheDel(CACHE_KEYS.group(group.id));
  await cacheDel(CACHE_KEYS.userGroups(userId));
  await cacheDel(CACHE_KEYS.groupMembers(group.id));

  // Emit real-time event
  const joiningUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  emitMemberJoined(group.id, userId, joiningUser?.name ?? "Unknown");

  // Notify existing group members
  const existingMembers = await prisma.groupMember.findMany({
    where: { groupId: group.id },
    select: { userId: true },
  });

  for (const member of existingMembers) {
    if (member.userId === userId) continue;

    void addNotificationJob({
      userId: member.userId,
      type: "member_joined",
      title: "New member joined",
      body: `${joiningUser?.name ?? "Someone"} joined ${group.name}`,
      metadata: {
        groupId: group.id,
      },
    });
  }

  return { groupId: group.id, groupName: group.name };
}

// ─────────────────────────────────────────────
// LEAVE GROUP
// ─────────────────────────────────────────────

export async function leaveGroup(
  groupId: string,
  userId: string
) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });

  if (!member) {
    throw ApiError.badRequest(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  if (member.role === "admin") {
    const otherAdmins = await prisma.groupMember.count({
      where: {
        groupId,
        role: "admin",
        userId: { not: userId },
      },
    });

    if (otherAdmins === 0) {
      const totalMembers = await prisma.groupMember.count({
        where: { groupId },
      });

      if (totalMembers > 1) {
        throw ApiError.badRequest(
          "You are the only admin. Please assign another admin before leaving.",
          ErrorCode.NOT_GROUP_ADMIN
        );
      }
    }
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  const remainingMembers = await prisma.groupMember.count({
    where: { groupId },
  });

  if (remainingMembers === 0) {
    await prisma.group.update({
      where: { id: groupId },
      data: { isArchived: true },
    });
  }

  await cacheDel(CACHE_KEYS.group(groupId));
  await cacheDel(CACHE_KEYS.userGroups(userId));
  await cacheDel(CACHE_KEYS.groupMembers(groupId));
  await cacheDel(CACHE_KEYS.membership(groupId, userId));

  // Emit real-time event
  const leavingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  emitMemberLeft(groupId, userId, leavingUser?.name ?? "Unknown");
}

// ─────────────────────────────────────────────
// GET GROUP MEMBERS
// ─────────────────────────────────────────────

export async function getGroupMembers(
  groupId: string,
  userId: string
) {
  await assertGroupMember(groupId, userId);

  const cacheKey = CACHE_KEYS.groupMembers(groupId);
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          currencyPref: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });

  const result = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    groupId: m.groupId,
    role: m.role,
    joinedAt: m.joinedAt,
    user: m.user,
  }));

  await cacheSet(cacheKey, result, 120);
  return result;
}

// ─────────────────────────────────────────────
// GET GROUP BALANCES
// ─────────────────────────────────────────────

export async function getGroupBalances(
  groupId: string,
  userId: string
) {
  await assertGroupMember(groupId, userId);

  const balances = await calculateGroupBalances(groupId);
  return balances;
}

// ─────────────────────────────────────────────
// GET SETTLE SUGGESTIONS
// ─────────────────────────────────────────────

export async function getSettleSuggestions(
  groupId: string,
  userId: string
) {
  await assertGroupMember(groupId, userId);

  const balances = await calculateGroupBalances(groupId);

  return {
    groupId,
    suggestions: balances.debts,
    currency: balances.currency,
  };
}

// ─────────────────────────────────────────────
// UPDATE MEMBER ROLE (admin only)
// ─────────────────────────────────────────────

export async function updateMemberRole(
  groupId: string,
  requesterId: string,
  targetUserId: string,
  newRole: "admin" | "member"
) {
  await assertGroupAdmin(groupId, requesterId);

  if (requesterId === targetUserId) {
    throw ApiError.badRequest(
      "You cannot change your own role",
      ErrorCode.FORBIDDEN
    );
  }

  const targetMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
    select: { role: true },
  });

  if (!targetMember) {
    throw ApiError.notFound("Member");
  }

  if (targetMember.role === newRole) {
    throw ApiError.badRequest(
      `User is already a ${newRole}`,
      ErrorCode.CONFLICT
    );
  }

  const updated = await prisma.groupMember.update({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  await cacheDel(CACHE_KEYS.groupMembers(groupId));
  await cacheDel(CACHE_KEYS.membership(groupId, targetUserId));

  return updated;
}

// ─────────────────────────────────────────────
// REMOVE MEMBER (admin only)
// ─────────────────────────────────────────────

export async function removeMember(
  groupId: string,
  requesterId: string,
  targetUserId: string
) {
  await assertGroupAdmin(groupId, requesterId);

  if (requesterId === targetUserId) {
    throw ApiError.badRequest(
      "You cannot remove yourself. Use the leave group option instead.",
      ErrorCode.FORBIDDEN
    );
  }

  const targetMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
    select: { role: true },
  });

  if (!targetMember) {
    throw ApiError.notFound("Member");
  }

  if (targetMember.role === "admin") {
    throw ApiError.badRequest(
      "Cannot remove an admin. Demote them to member first.",
      ErrorCode.FORBIDDEN
    );
  }

  await prisma.groupMember.delete({
    where: {
      groupId_userId: { groupId, userId: targetUserId },
    },
  });

  await cacheDel(CACHE_KEYS.groupMembers(groupId));
  await cacheDel(CACHE_KEYS.group(groupId));
  await cacheDel(CACHE_KEYS.userGroups(targetUserId));
  await cacheDel(CACHE_KEYS.membership(groupId, targetUserId));

  // Emit real-time event
  const removedUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { name: true },
  });
  emitMemberLeft(groupId, targetUserId, removedUser?.name ?? "Unknown");
}

// ─────────────────────────────────────────────
// REGENERATE INVITE CODE (admin only)
// ─────────────────────────────────────────────

export async function regenerateInviteCode(
  groupId: string,
  requesterId: string
) {
  await assertGroupAdmin(groupId, requesterId);

  const newCode = await generateUniqueInviteCode();

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: newCode },
    select: { id: true, inviteCode: true },
  });

  await cacheDel(CACHE_KEYS.group(groupId));

  return updated;
}