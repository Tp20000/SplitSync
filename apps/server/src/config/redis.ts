// FILE: apps/server/src/config/redis.ts
// PURPOSE: Redis client singleton with retry logic and pub/sub support
// DEPENDS ON: ioredis, .env (REDIS_HOST, REDIS_PORT)
// LAST UPDATED: F03 - Redis + BullMQ Setup

import Redis from "ioredis";

// ─────────────────────────────────────────────
// Redis connection options
// ─────────────────────────────────────────────

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? undefined;

const redisConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  retryStrategy(times: number): number | null {
    // Retry with exponential backoff up to 30 seconds
    if (times > 10) {
      console.error("[Redis] Max retry attempts reached. Giving up.");
      return null;
    }
    const delay = Math.min(times * 500, 30000);
    console.warn(`[Redis] Retrying connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
};

// ─────────────────────────────────────────────
// Main Redis client (for caching + general use)
// ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

const redisClient: Redis =
  global.__redisClient ?? new Redis(redisConnectionOptions);

if (process.env.NODE_ENV !== "production") {
  global.__redisClient = redisClient;
}

redisClient.on("connect", () => {
  console.log("[Redis] Client connected");
});

redisClient.on("error", (err: Error) => {
  console.error("[Redis] Client error:", err.message);
});

redisClient.on("close", () => {
  console.warn("[Redis] Client connection closed");
});

// ─────────────────────────────────────────────
// Subscriber Redis client (for pub/sub)
// A separate connection is required for subscriptions
// ─────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __redisSubscriber: Redis | undefined;
}

const redisSubscriber: Redis =
  global.__redisSubscriber ?? new Redis(redisConnectionOptions);

if (process.env.NODE_ENV !== "production") {
  global.__redisSubscriber = redisSubscriber;
}

redisSubscriber.on("connect", () => {
  console.log("[Redis] Subscriber connected");
});

redisSubscriber.on("error", (err: Error) => {
  console.error("[Redis] Subscriber error:", err.message);
});

// ─────────────────────────────────────────────
// Cache helper utilities
// ─────────────────────────────────────────────

/**
 * Set a cache value with optional TTL (seconds)
 */
async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redisClient.setex(key, ttlSeconds, serialized);
  } else {
    await redisClient.set(key, serialized);
  }
}

/**
 * Get a cache value and parse JSON
 */
async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redisClient.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

/**
 * Delete a cache key
 */
async function cacheDel(key: string): Promise<void> {
  await redisClient.del(key);
}

/**
 * Delete all keys matching a pattern
 */
async function cacheDelPattern(pattern: string): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}

/**
 * Gracefully disconnect both Redis clients
 */
async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
  await redisSubscriber.quit();
  console.log("[Redis] All connections closed gracefully");
}

export {
  redisClient,
  redisSubscriber,
  cacheSet,
  cacheGet,
  cacheDel,
  cacheDelPattern,
  disconnectRedis,
  redisConnectionOptions,
};