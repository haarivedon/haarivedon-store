/**
 * Fixed-window rate limiter for the public intake routes (PLAN.md §13:
 * 5 submissions per IP per hour per form).
 *
 * In-memory on purpose. The API runs as a single long-lived Node process and
 * the traffic here is a few hundred visits a day — a Redis dependency would
 * cost more than it protects. If the API is ever scaled to more than one
 * instance, this needs to move to a shared store.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Sweep expired windows occasionally so the map cannot grow unbounded. */
const sweep = (now: number) => {
  if (windows.size < 500) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
};

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets — sent as `Retry-After`. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60 * 60 * 1000 } = {},
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client address. Behind a proxy the first `x-forwarded-for` hop
 * is the client; falls back to a shared bucket, which rate-limits the whole
 * world together rather than nobody at all.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
