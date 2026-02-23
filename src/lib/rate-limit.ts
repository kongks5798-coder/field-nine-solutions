/**
 * In-memory sliding window rate limiter.
 * For production, replace with Redis-based solution.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000).unref?.();
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 60,
  windowMs: 60_000, // 1 minute
};

/**
 * Check and consume a rate limit token for the given key.
 */
export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const { limit, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, limit, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Reset rate limit for a specific key.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clear all rate limit entries.
 */
export function clearAllRateLimits(): void {
  store.clear();
}
