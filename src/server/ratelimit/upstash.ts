import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Null when Upstash is not configured (local dev without rate limiting). */
export const redis = url && token ? new Redis({ url, token }) : null;

/**
 * Login / credential-endpoint throttling (docs/prd.md R7). Apply per-IP and
 * per-account; return the same generic error regardless of which limit trips.
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      prefix: "rl:login",
      analytics: false,
    })
  : null;

export async function checkLoginRateLimit(key: string): Promise<{ ok: boolean }> {
  if (!loginRateLimit) return { ok: true };
  const { success } = await loginRateLimit.limit(key);
  return { ok: success };
}
