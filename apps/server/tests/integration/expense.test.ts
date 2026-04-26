// FILE: apps/server/tests/integration/expense.test.ts
// PURPOSE: Integration tests for expense CRUD API
// DEPENDS ON: supertest, testServer, testDb
// LAST UPDATED: F44 - Integration Tests

import request from "supertest";
import { createTestApp } from "../helpers/testServer";
import {
  cleanDb,
  createTestUser,
  createTestGroup,
  generateTestToken,
} from "../helpers/testDb";
import prisma from "../../src/config/database";

const app = createTestApp();

// ─────────────────────────────────────────────
// Test state
// ─────────────────────────────────────────────

let user1: Awaited<ReturnType<typeof createTestUser>>;
let user2: Awaited<ReturnType<typeof createTestUser>>;
let token1: string;
let token2: string;
let groupId: string;

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────

beforeAll(async () => {
  await cleanDb();

  user1 = await createTestUser({
    email: "expense_user1@test.com",
  });
  user2 = await createTestUser({
    email: "expense_user2@test.com",
  });

  token1 = generateTestToken(user1.user);
  token2 = generateTestToken(user2.user);

  const group = await createTestGroup(user1.user.id, [
    user2.user.id,
  ]);
  groupId = group.id;
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

// ─────────────────────────────────────────────
// CREATE EXPENSE
// ─────────────────────────────────────────────

describe("POST /api/v1/groups/:id/expenses", () => {
  it("should create expense with equal split", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Dinner",
        totalAmount: 1000,
        currency: "INR",
        category: "food",
        splitType: "equal",
        splits: [
          { userId: user1.user.id },
          { userId: user2.user.id },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.expense.title).toBe("Dinner");
    expect(res.body.data.expense.totalAmount).toBe("1000");
    expect(res.body.data.expense.splits).toHaveLength(2);

    // Each person owes 500
    const amounts = res.body.data.expense.splits.map(
      (s: { owedAmount: string }) => s.owedAmount
    );
    expect(amounts).toContain("500");
  });

  it("should create expense with exact split", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Hotel",
        totalAmount: 5000,
        currency: "INR",
        category: "accommodation",
        splitType: "exact",
        splits: [
          { userId: user1.user.id, value: 3000 },
          { userId: user2.user.id, value: 2000 },
        ],
      });

    expect(res.status).toBe(201);
    const splits = res.body.data.expense.splits as Array<{
      userId: string;
      owedAmount: string;
    }>;
    const user1Split = splits.find(
      (s) => s.userId === user1.user.id
    );
    const user2Split = splits.find(
      (s) => s.userId === user2.user.id
    );
    expect(user1Split?.owedAmount).toBe("3000");
    expect(user2Split?.owedAmount).toBe("2000");
  });

  it("should create expense with percentage split", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Cab",
        totalAmount: 300,
        currency: "INR",
        category: "transport",
        splitType: "percentage",
        splits: [
          { userId: user1.user.id, value: 60 },
          { userId: user2.user.id, value: 40 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.expense.splitType).toBe("percentage");
  });

  it("should return 422 for invalid split type", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Test",
        totalAmount: 100,
        splitType: "invalid_type",
        splits: [{ userId: user1.user.id }],
      });

    expect(res.status).toBe(422);
  });

  it("should return 422 for exact split mismatch", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Bad Split",
        totalAmount: 1000,
        splitType: "exact",
        splits: [
          { userId: user1.user.id, value: 600 },
          { userId: user2.user.id, value: 600 }, // Total: 1200 ≠ 1000
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SPLIT_MISMATCH");
  });

  it("should return 403 for non-member", async () => {
    const nonMember = await createTestUser({
      email: `nonmember_${Date.now()}@test.com`,
    });
    const nonMemberToken = generateTestToken(nonMember.user);

    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${nonMemberToken}`)
      .send({
        title: "Unauthorized",
        totalAmount: 100,
        splitType: "equal",
        splits: [{ userId: user1.user.id }],
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("NOT_GROUP_MEMBER");
  });

  it("should return 401 without token", async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .send({
        title: "No Auth",
        totalAmount: 100,
        splitType: "equal",
        splits: [{ userId: user1.user.id }],
      });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// LIST EXPENSES
// ─────────────────────────────────────────────

describe("GET /api/v1/groups/:id/expenses", () => {
  it("should list group expenses with pagination", async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it("should support pagination params", async () => {
    const res = await request(app)
      .get(
        `/api/v1/groups/${groupId}/expenses?page=1&limit=2`
      )
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta.limit).toBe(2);
  });

  it("should filter by category", async () => {
    const res = await request(app)
      .get(
        `/api/v1/groups/${groupId}/expenses?category=food`
      )
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    res.body.data.forEach(
      (expense: { category: string }) => {
        expect(expense.category).toBe("food");
      }
    );
  });

  it("should return 403 for non-member", async () => {
    const nonMember = await createTestUser({
      email: `nm_list_${Date.now()}@test.com`,
    });
    const nmToken = generateTestToken(nonMember.user);

    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${nmToken}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// GET SINGLE EXPENSE
// ─────────────────────────────────────────────

describe("GET /api/v1/groups/:id/expenses/:eid", () => {
  let expenseId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Get Single Test",
        totalAmount: 200,
        splitType: "equal",
        splits: [
          { userId: user1.user.id },
          { userId: user2.user.id },
        ],
      });
    expenseId = res.body.data.expense.id as string;
  });

  it("should get expense by ID", async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses/${expenseId}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data.expense.id).toBe(expenseId);
    expect(res.body.data.expense.title).toBe("Get Single Test");
    expect(res.body.data.expense.splits).toHaveLength(2);
    expect(res.body.data.expense.paidByUser).toBeDefined();
  });

  it("should return 404 for non-existent expense", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses/${fakeId}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────
// UPDATE EXPENSE (OCC)
// ─────────────────────────────────────────────

describe("PATCH /api/v1/groups/:id/expenses/:eid", () => {
  let expenseId: string;
  let version: number;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "To Update",
        totalAmount: 500,
        splitType: "equal",
        splits: [
          { userId: user1.user.id },
          { userId: user2.user.id },
        ],
      });
    expenseId = res.body.data.expense.id as string;
    version = res.body.data.expense.version as number;
  });

  it("should update expense with correct version", async () => {
    const res = await request(app)
      .patch(
        `/api/v1/groups/${groupId}/expenses/${expenseId}`
      )
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Updated Title",
        version,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.expense.title).toBe("Updated Title");
    expect(res.body.data.expense.version).toBe(version + 1);
  });

  it("should return 409 for version conflict", async () => {
    const res = await request(app)
      .patch(
        `/api/v1/groups/${groupId}/expenses/${expenseId}`
      )
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "Conflict Update",
        version: 1, // Stale version
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EXPENSE_LOCKED");
  });
});

// ─────────────────────────────────────────────
// DELETE EXPENSE
// ─────────────────────────────────────────────

describe("DELETE /api/v1/groups/:id/expenses/:eid", () => {
  let expenseId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        title: "To Delete",
        totalAmount: 100,
        splitType: "equal",
        splits: [
          { userId: user1.user.id },
          { userId: user2.user.id },
        ],
      });
    expenseId = res.body.data.expense.id as string;
  });

  it("should soft-delete expense", async () => {
    const res = await request(app)
      .delete(
        `/api/v1/groups/${groupId}/expenses/${expenseId}`
      )
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain("deleted");
  });

  it("should return 404 for deleted expense", async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses/${expenseId}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(404);
  });

  it("should not appear in list after deletion", async () => {
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}/expenses`)
      .set("Authorization", `Bearer ${token1}`);

    const ids = (
      res.body.data as Array<{ id: string }>
    ).map((e) => e.id);

    expect(ids).not.toContain(expenseId);
  });
});