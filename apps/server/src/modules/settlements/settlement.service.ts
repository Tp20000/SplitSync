// FILE: apps/server/src/modules/settlements/settlement.service.ts
// PURPOSE: Settlement business logic — record + list
// DEPENDS ON: prisma, decimal.js, ApiError, socket emitters
// LAST UPDATED: F25 - Settlement Recording API

import Decimal from "decimal.js";
import prisma from "../../config/database";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import {
  emitSettlementCreated,
  emitBalanceUpdated,
} from "../../socket/emitters";

import type {
  CreateSettlementInput,
  ListSettlementsQuery,
} from "./settlement.validation";
import { addNotificationJob, addEmailJob } from "../../config/queue";

// ─────────────────────────────────────────────
// CREATE SETTLEMENT
// ─────────────────────────────────────────────

export async function createSettlement(
  groupId: string,
  paidBy: string,
  input: CreateSettlementInput
) {
  const { paidTo, amount, currency, note } = input;

  // Cannot settle with yourself
  if (paidBy === paidTo) {
    throw ApiError.badRequest(
      "You cannot settle with yourself",
      ErrorCode.INVALID_INPUT
    );
  }

  // Verify both users are group members
  const [payerMember, receiverMember] = await Promise.all([
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidBy } },
      select: { id: true },
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: paidTo } },
      select: { id: true },
    }),
  ]);

  if (!payerMember) {
    throw ApiError.forbidden(
      "You are not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  if (!receiverMember) {
    throw ApiError.badRequest(
      "Recipient is not a member of this group",
      ErrorCode.NOT_GROUP_MEMBER
    );
  }

  // Create settlement
  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      paidBy,
      paidTo,
      amount: new Decimal(amount),
      currency: currency ?? "INR",
      note,
    },
    include: {
      paidByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      paidToUser: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Format for response
  const formatted = formatSettlement(settlement);

  // Emit real-time events
  emitSettlementCreated(
    groupId,
    formatted as unknown as Record<string, unknown>
  );
  emitBalanceUpdated(groupId);

  // Queue notification for recipient
  void addNotificationJob({
    userId: paidTo,
    type: "settlement_received",
    title: "Payment received",
    body: `${settlement.paidByUser.name} paid you ${formatAmount(amount, currency ?? "INR")} in ${settlement.group.name}`,
    metadata: {
      groupId,
      settlementId: settlement.id,
      amount: amount.toString(),
      currency: currency ?? "INR",
    },
  });

  // Email the recipient
  const recipientUser = await prisma.user.findUnique({
    where: { id: paidTo },
    select: { email: true, name: true },
  });

  if (recipientUser) {
    void addEmailJob({
      to: recipientUser.email,
      subject: `${settlement.paidByUser.name} paid you ${formatAmount(amount, currency ?? "INR")}`,
      templateName: "settlement-received",
      templateData: {
        recipientName: recipientUser.name,
        payerName: settlement.paidByUser.name,
        amount: formatAmount(amount, currency ?? "INR"),
        groupName: settlement.group.name,
        groupId,
        note: note ?? undefined,
      },
    });
  }

  return formatted;
}

// ─────────────────────────────────────────────
// LIST SETTLEMENTS
// ─────────────────────────────────────────────

export async function listSettlements(
  groupId: string,
  userId: string,
  query: ListSettlementsQuery
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

  const page = parseInt(query.page, 10);
  const limit = Math.min(parseInt(query.limit, 10), 50);
  const skip = (page - 1) * limit;

  const [settlements, total] = await Promise.all([
    prisma.settlement.findMany({
      where: { groupId },
      include: {
        paidByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        paidToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { settledAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.settlement.count({ where: { groupId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    settlements: settlements.map(formatSettlement),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatSettlement(settlement: Record<string, unknown>) {
  const s = settlement as Record<string, unknown> & {
    amount: { toString: () => string } | string;
  };

  return {
    ...s,
    amount:
      typeof s.amount === "object"
        ? s.amount.toString()
        : s.amount,
  };
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}