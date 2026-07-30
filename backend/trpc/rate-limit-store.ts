/**
 * Distributed rate-limit counter store.
 * Upstash REST (UPSTASH_REDIS_REST_*) or node-redis (REDIS_URL).
 * In-memory fallback only when NODE_ENV !== production or RATE_LIMIT_MEMORY_FALLBACK=true.
 */

export type RateLimitCheckResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
let warnedMemoryInProduction = false;

function upstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

function redisUrlConfigured(): boolean {
  return !!process.env.REDIS_URL?.trim();
}

export function isDistributedRateLimitConfigured(): boolean {
  return upstashConfigured() || redisUrlConfigured();
}

function allowMemoryFallback(): boolean {
  const flag = process.env.RATE_LIMIT_MEMORY_FALLBACK?.trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  return process.env.NODE_ENV !== "production";
}

function memoryCheck(
  key: string,
  windowMs: number,
  maxRequests: number,
): RateLimitCheckResult {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

async function upstashIncrWithTtl(
  redisKey: string,
  windowSec: number,
): Promise<number> {
  const base = process.env.UPSTASH_REDIS_REST_URL!.trim().replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const incrRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify(["INCR", redisKey]),
  });
  if (!incrRes.ok) {
    throw new Error(`Upstash INCR failed: HTTP ${incrRes.status}`);
  }
  const incrBody = (await incrRes.json()) as { result?: unknown };
  const count = Number(incrBody.result);
  if (!Number.isFinite(count)) {
    throw new Error("Upstash INCR returned invalid count");
  }
  if (count === 1) {
    const expireRes = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify(["EXPIRE", redisKey, windowSec]),
    });
    if (!expireRes.ok) {
      throw new Error(`Upstash EXPIRE failed: HTTP ${expireRes.status}`);
    }
  }
  return count;
}

let redisClientPromise: Promise<{
  incr: (k: string) => Promise<number>;
  expire: (k: string, sec: number) => Promise<number>;
  ping: () => Promise<string>;
  quit: () => Promise<void>;
}> | null = null;

async function getRedisClient() {
  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const { createClient } = await import("redis");
      const client = createClient({ url: process.env.REDIS_URL!.trim() });
      client.on("error", () => {
        /* logged at check time */
      });
      await client.connect();
      return {
        incr: (k: string) => client.incr(k),
        expire: (k: string, sec: number) => client.expire(k, sec),
        ping: () => client.ping(),
        quit: async () => {
          await client.quit();
        },
      };
    })();
  }
  return redisClientPromise;
}

async function redisIncrWithTtl(redisKey: string, windowSec: number): Promise<number> {
  const client = await getRedisClient();
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSec);
  }
  return count;
}

async function distributedCheck(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitCheckResult> {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `medvba:rl:${key}:${bucket}`;

  let count: number;
  if (upstashConfigured()) {
    count = await upstashIncrWithTtl(redisKey, windowSec);
  } else {
    count = await redisIncrWithTtl(redisKey, windowSec);
  }

  if (count > maxRequests) {
    const windowEnd = (bucket + 1) * windowMs;
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000)),
    };
  }
  return { allowed: true };
}

/** Lightweight connectivity check for readiness (boolean only; no error details). */
export async function probeRateLimitRedis(): Promise<boolean> {
  if (!isDistributedRateLimitConfigured()) {
    return false;
  }
  try {
    if (upstashConfigured()) {
      const base = process.env.UPSTASH_REDIS_REST_URL!.trim().replace(/\/$/, "");
      const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
      const res = await fetch(base, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["PING"]),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { result?: unknown };
      return body.result === "PONG" || body.result === "pong";
    }
    const client = await getRedisClient();
    const pong = await client.ping();
    return pong.toUpperCase() === "PONG";
  } catch {
    return false;
  }
}

export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitCheckResult> {
  if (isDistributedRateLimitConfigured()) {
    try {
      return await distributedCheck(key, windowMs, maxRequests);
    } catch (err) {
      console.error("[rate-limit] distributed store error", {
        error: err instanceof Error ? err.message : "unknown",
      });
      throw err;
    }
  }

  if (!allowMemoryFallback()) {
    throw new Error(
      "Rate limiting is not configured (set UPSTASH_REDIS_REST_* or REDIS_URL, or RATE_LIMIT_MEMORY_FALLBACK for dev)",
    );
  }

  if (process.env.NODE_ENV === "production" && !warnedMemoryInProduction) {
    warnedMemoryInProduction = true;
    console.warn(
      "[rate-limit] Using in-memory store in production — not shared across instances",
    );
  }

  return memoryCheck(key, windowMs, maxRequests);
}
