/**
 * Upstash Redis 기반 분산 Rate Limiter
 * 서버리스/Edge 환경에서 인스턴스 간 카운트 공유 가능
 *
 * 환경변수:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * 미설정 시 in-memory fallback (개발/테스트 환경)
 */

import { checkLimit as checkLimitInMemory, headersFor, ipFromHeaders, RateLimitResult } from "./rateLimit";

let _ratelimit: unknown = null;

async function getUpstash() {
  if (_ratelimit) return _ratelimit as { limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: false,
    });
    return _ratelimit as { limit: (key: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  } catch {
    return null;
  }
}

/**
 * 분산 Rate Limit 체크 (Upstash Redis 우선, fallback: in-memory)
 * @param key    고유 키 (예: "ai-stream:192.168.1.1")
 * @param limit  허용 횟수 (in-memory fallback에서만 사용)
 * @param windowMs 윈도우 ms (in-memory fallback에서만 사용)
 */
export async function checkLimitRedis(
  key: string,
  limit = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  const upstash = await getUpstash();
  if (!upstash) {
    // Fallback to in-memory
    return checkLimitInMemory(key, limit, windowMs);
  }

  const result = await upstash.limit(key);
  return {
    ok: result.success,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: Math.ceil(result.reset / 1000),
  };
}

export { headersFor, ipFromHeaders };
