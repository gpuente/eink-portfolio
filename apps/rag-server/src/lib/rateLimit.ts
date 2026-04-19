import { env } from "../env.ts";

type Bucket = { count: number; resetAt: number };
const HOUR_MS = 60 * 60 * 1000;

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Simple in-memory IP rate limiter. Resets per IP every rolling hour.
 * Resets when the server restarts (acceptable for v1 — for production behind
 * a load balancer, swap to Redis or upstash).
 *
 * Setting `RATE_LIMIT_PER_HOUR=0` disables the limiter entirely — useful
 * locally where you're benchmarking against your own machine. In prod
 * pick a value generous enough that legitimate bursts don't hit (e.g. 120).
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const limit = env.RATE_LIMIT_PER_HOUR;

  // 0 = disabled. Return sentinel values so the headers still render
  // something sensible (remaining=Infinity isn't a valid number for
  // a header, so expose a large integer instead).
  if (limit <= 0) {
    return { allowed: true, remaining: 999_999, resetAt: Date.now() + HOUR_MS };
  }

  const now = Date.now();
  const existing = buckets.get(ip);

  if (!existing || now >= existing.resetAt) {
    const bucket: Bucket = { count: 1, resetAt: now + HOUR_MS };
    buckets.set(ip, bucket);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: bucket.resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Best-effort client IP extraction. Honors X-Forwarded-For when present
 * (set by Cloudflare, Fly.io, Railway, etc.), falls back to a sentinel.
 */
export function clientIp(headerValue: string | undefined): string {
  if (!headerValue) return "unknown";
  const first = headerValue.split(",")[0]?.trim();
  return first || "unknown";
}
