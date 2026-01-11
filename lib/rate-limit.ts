/**
 * Rate Limiting 유틸리티
 * 간단한 메모리 기반 Rate Limiting (프로덕션에서는 Redis 사용 권장)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limit 체크
 * @param key 고유 키 (예: IP 주소, 사용자 ID)
 * @param maxRequests 최대 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns 허용 여부
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // 새 엔트리 생성 또는 리셋
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limit 초과
  }

  entry.count++;
  return true;
}

/**
 * Rate Limit 정보 조회
 */
export function getRateLimitInfo(key: string): {
  remaining: number;
  resetAt: number;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.resetAt) {
    rateLimitStore.delete(key);
    return null;
  }

  return {
    remaining: Math.max(0, entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Rate Limit 스토어 정리 (만료된 엔트리 제거)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// 주기적으로 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
