import { TRPCError } from "@trpc/server";

import { checkRateLimit } from "./rate-limit-store";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function createRateLimiter(config: RateLimitConfig = {}) {
  const windowMs = config.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const maxRequests = config.maxRequests ?? MAX_REQUESTS_PER_WINDOW;
  const keyPrefix = config.keyPrefix ?? "tutor";

  return async function rateLimit(identifier: string): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;
    let result;
    try {
      result = await checkRateLimit(key, windowMs, maxRequests);
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Rate limiting is temporarily unavailable. Please try again shortly.",
      });
    }

    if (!result.allowed) {
      const retryAfterSec = result.retryAfterSec ?? 60;
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please wait ${retryAfterSec} seconds before making more requests.`,
      });
    }
  };
}

export const tutorRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: "clinical-ai",
});
