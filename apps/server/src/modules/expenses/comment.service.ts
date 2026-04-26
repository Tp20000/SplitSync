// FILE: apps/server/src/modules/expenses/comment.service.ts
// PURPOSE: Comment business logic — create + list
// DEPENDS ON: prisma, ApiError, socket emitters, queue
// LAST UPDATED: F28 - Comments on Expenses

import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import { emitCommentCreated } from "../../socket/emitters";
import { addNotificationJob } from "../../config/queue";
import type { CreateCommentInput } from "./comment.validation";

// ─────────────────────────────────────────────
// CREATE COMMENT
// ─────────────────────────────────────────────

export async function createComment(
  groupId: string,
  expenseId: string,
  userId: string,
  input: CreateCommentInput
) {
  // Verify membership
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

  // Verify expense exists and belongs to group
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    select: {
      id: true,
      title: true,
      paidBy: true,
      splits: { select: { userId: true } },
    },
  });

  if (!expense) {
    throw ApiError.notFound("Expense");
  }

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      expenseId,
      userId,
      content: input.content,
    },
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

  // Emit real-time event
  emitCommentCreated(groupId, expenseId, {
    id: comment.id,
    expenseId: comment.expenseId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    user: comment.user,
  });

  // Notify expense participants (except commenter)
  const participantIds = new Set<string>();
  participantIds.add(expense.paidBy);
  expense.splits.forEach((s) => participantIds.add(s.userId));
  participantIds.delete(userId); // Don't notify self

  for (const participantId of participantIds) {
    void addNotificationJob({
      userId: participantId,
      type: "comment_added",
      title: "New comment",
      body: `${comment.user.name} commented on "${expense.title}"`,
      metadata: {
        groupId,
        expenseId,
        commentId: comment.id,
      },
    });
  }

  return comment;
}

// ─────────────────────────────────────────────
// LIST COMMENTS
// ─────────────────────────────────────────────

export async function listComments(
  groupId: string,
  expenseId: string,
  userId: string
) {
  // Verify membership
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

  // Verify expense
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId, isDeleted: false },
    select: { id: true },
  });

  if (!expense) {
    throw ApiError.notFound("Expense");
  }

  const comments = await prisma.comment.findMany({
    where: { expenseId },
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
    orderBy: { createdAt: "asc" },
  });

  return comments;
}