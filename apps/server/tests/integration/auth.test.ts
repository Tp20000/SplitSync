// FILE: apps/server/tests/integration/auth.test.ts
// PURPOSE: Integration tests for auth endpoints
// DEPENDS ON: supertest, testServer, testDb
// LAST UPDATED: F44 - Integration Tests

import request from "supertest";
import { createTestApp } from "../helpers/testServer";
import {
  cleanDb,
  createTestUser,
} from "../helpers/testDb";
import prisma from "../../src/config/database";


const app = createTestApp();

// ─────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────

const VALID_USER = {
  name: "Alice Smith",
  email: `alice_${Date.now()}@test.com`, // Unique per run
  password: "Alice1234",
};

// ─────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────

beforeAll(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});
// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

describe("POST /api/v1/auth/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(VALID_USER.email);
    expect(res.body.data.user.name).toBe(VALID_USER.name);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should set httpOnly refresh token cookie", async () => {
    const uniqueEmail = `register_cookie_${Date.now()}@test.com`;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID_USER, email: uniqueEmail });

    expect(res.status).toBe(201);
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken=")
    );
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain("HttpOnly");
  });

  it("should return 409 for duplicate email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID_USER);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

    it("should return 422 for missing name", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "test2@test.com", password: "Test1234" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // Details will show field errors (body-level or field-level)
    expect(res.body.error.details).toBeDefined();
  });

  it("should return 422 for weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test",
        email: "weak@test.com",
        password: "weak",
      });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 422 for invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test",
        email: "not-an-email",
        password: "Test1234",
      });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

describe("POST /api/v1/auth/login", () => {
  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(VALID_USER.email);
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: VALID_USER.email,
        password: "WrongPassword1",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "nobody@test.com",
        password: "Test1234",
      });

    expect(res.status).toBe(401);
    // Generic message — prevents user enumeration
    expect(res.body.error.message).toContain(
      "Invalid email or password"
    );
  });

  it("should return 422 for missing password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: VALID_USER.email });

    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────
// PROTECTED ROUTE
// ─────────────────────────────────────────────

describe("GET /api/v1/users/me (protected)", () => {
  let accessToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });
    accessToken = loginRes.body.data.accessToken as string;
  });

  it("should return user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(VALID_USER.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/v1/users/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("should return 401 with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer invalid_token");

    expect(res.status).toBe(401);
  });

  it("should return 401 with malformed header", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "NotBearer token");

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

describe("POST /api/v1/auth/logout", () => {
  it("should logout successfully and clear cookie", async () => {
    const agent = request.agent(app);

    // Login first
    await agent.post("/api/v1/auth/login").send({
      email: VALID_USER.email,
      password: VALID_USER.password,
    });

    // Logout
    const res = await agent.post("/api/v1/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain("Logged out");
  });

  it("should always succeed even without token", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// PROFILE UPDATE
// ─────────────────────────────────────────────

describe("PATCH /api/v1/users/me", () => {
  let accessToken: string;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: VALID_USER.email,
        password: VALID_USER.password,
      });
    accessToken = loginRes.body.data.accessToken as string;
  });

  it("should update name successfully", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Alice Updated" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Alice Updated");
  });

  it("should update currency preference", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ currencyPref: "USD" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.currencyPref).toBe("USD");
  });

  it("should return 422 for name too short", async () => {
    const res = await request(app)
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "A" });

    expect(res.status).toBe(422);
  });
});