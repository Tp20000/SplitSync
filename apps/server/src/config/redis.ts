// FILE: apps/server/src/config/redis.ts
// PURPOSE: Redis client singleton with TLS support for Upstash
// DEPENDS ON: ioredis, .env
// LAST UPDATED: F47 Fix - Upstash TLS support

import Redis from "ioredis";

// ─────────────────────────────────────────────
// Connection config
// ─────────────────────────────────────────────

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? undefined;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ─────────────────────────────────────────────
// Build connection options
// Upstash requires TLS in production
// ─────────────────────────────────────────────

const redisConnectionOptions: Redis.RedisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  // Enable TLS for Upstash (production) or any non-local Redis
  ...(IS_PRODUCTION && REDIS_HOST !== "localhost"
    ? {
        tls: {
          rejectUnauthorized: false,
        },
      }
    : {}),

  retryStrategy(times: number): number | null {
    if (times > 10) {
      console.error(
        "[Redis] Max retry attempts reached. Giving up."
      );
      return null;
    }
    const delay = Math.min(times * 500, 10000);
    console.warn(
      `[Redis] Retrying in ${delay}ms... (attempt ${times})`
    );
    return delay;
  },
};

// ─────────────────────────────────────────────
// Main Redis client
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
// Subscriber client
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
// Cache helpers
// ─────────────────────────────────────────────

async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (err) {
    console.error("[Redis] cacheSet error:", (err as Error).message);
  }
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("[Redis] cacheGet error:", (err as Error).message);
    return null;
  }
}

async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("[Redis] cacheDel error:", (err as Error).message);
  }
}

async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    console.error(
      "[Redis] cacheDelPattern error:",
      (err as Error).message
    );
  }
}

async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    console.log("[Redis] All connections closed gracefully");
  } catch (err) {
    console.error(
      "[Redis] Disconnect error:",
      (err as Error).message
    );
  }
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