import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Null when Upstash is not configured (local dev without rate limiting). */
export const redis = url && token ? new Redis({ url, token }) : null;

function limiter(max: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string) {
  return redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, window),
        prefix,
        analytics: false,
      })
    : null;
}

/**
 * Login / credential-endpoint throttling (docs/prd.md R7). Cross-instance, so it
 * holds on Vercel where Better Auth's in-memory limiter does not. Return the same
 * generic error regardless of which limit trips.
 */
const loginRateLimit = limiter(5, "5 m", "rl:login");
const passwordResetRateLimit = limiter(5, "15 m", "rl:pwreset");

async function check(rl: Ratelimit | null, key: string): Promise<{ ok: boolean }> {
  if (!rl) return { ok: true };
  const { success } = await rl.limit(key);
  return { ok: success };
}

export const checkLoginRateLimit = (key: string) => check(loginRateLimit, key);
export const checkPasswordResetRateLimit = (key: string) =>
  check(passwordResetRateLimit, key);
