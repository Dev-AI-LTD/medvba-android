import { probeSupabaseServiceRole } from "./health-supabase";
import {
  isDistributedRateLimitConfigured,
  probeRateLimitRedis,
} from "../trpc/rate-limit-store";

export type ReadinessProbeBooleans = {
  redisConfigured: boolean;
  redisReady: boolean;
  supabaseConfigured: boolean;
  supabaseReady: boolean;
};

const CACHE_TTL_MS = 20_000;
const PROBE_TIMEOUT_MS = 5_000;

let cached: { at: number; value: ReadinessProbeBooleans } | null = null;
let inFlight: Promise<ReadinessProbeBooleans> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("probe_timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

async function runProbes(): Promise<ReadinessProbeBooleans> {
  const supabaseConfigured =
    !!process.env.SUPABASE_URL?.trim() &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const redisConfigured = isDistributedRateLimitConfigured();

  let redisReady = false;
  if (redisConfigured) {
    try {
      redisReady = await withTimeout(probeRateLimitRedis(), PROBE_TIMEOUT_MS);
    } catch {
      redisReady = false;
    }
  }

  let supabaseReady = false;
  if (supabaseConfigured) {
    try {
      const probe = await withTimeout(probeSupabaseServiceRole(), PROBE_TIMEOUT_MS);
      supabaseReady = probe.ok;
    } catch {
      supabaseReady = false;
    }
  }

  return { redisConfigured, redisReady, supabaseConfigured, supabaseReady };
}

/** Cached deep readiness booleans (no URLs, hosts, or error bodies). */
export async function getReadinessProbeBooleans(): Promise<ReadinessProbeBooleans> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = (async () => {
    try {
      const value = await runProbes();
      cached = { at: Date.now(), value };
      return value;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** Test-only: reset in-process probe cache. */
export function resetReadinessProbeCacheForTests(): void {
  cached = null;
  inFlight = null;
}
