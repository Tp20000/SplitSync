// FILE: apps/server/tests/helpers/testDb.ts
// PURPOSE: Test database utilities — setup, teardown, factories
// DEPENDS ON: prisma, bcrypt
// LAST UPDATED: F44 - Integration Tests

import prisma from "../../src/config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────
// Clean specific tables between tests
// ─────────────────────────────────────────────

export async function cleanDb(): Promise<void> {
  // Delete in dependency order
  await prisma.comment.deleteMany();
  await prisma.expenseHistory.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
}

// ─────────────────────────────────────────────
// Create test user + return with token
// ─────────────────────────────────────────────

export async function createTestUser(overrides?: {
  email?: string;
  name?: string;
  password?: string;
}) {
  const email = overrides?.email ?? `test_${Date.now()}@example.com`;
  const name = overrides?.name ?? "Test User";
  const password = overrides?.password ?? "Test1234";

  const passwordHash = await bcrypt.hash(password, 4); // Low rounds for speed

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      currencyPref: "INR",
      timezone: "Asia/Kolkata",
    },
  });

  return { user, password, email };
}

// ─────────────────────────────────────────────
// Generate valid JWT for test user (bypass login)
// ─────────────────────────────────────────────

export function generateTestToken(user: {
  id: string;
  email: string;
  name: string;
}): string {
  const secret =
    process.env.JWT_ACCESS_SECRET ?? "test_secret_minimum_16";

  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret,
    {
      expiresIn: "1h",
      issuer: "splitsync",
      audience: "splitsync-client",
    }
  );
}

// ─────────────────────────────────────────────
// Create test group with members
// ─────────────────────────────────────────────

export async function createTestGroup(
  creatorId: string,
  memberIds: string[] = []
) {
  const group = await prisma.group.create({
    data: {
      name: "Test Group",
      description: "Integration test group",
      type: "general",
      inviteCode: `TEST${Date.now()}`.slice(0, 8).toUpperCase(),
      createdBy: creatorId,
      members: {
        create: [
          { userId: creatorId, role: "admin" },
          ...memberIds.map((id) => ({ userId: id, role: "member" })),
        ],
      },
    },
  });

  return group;
}