/**
 * 간단한 Rate Limiting 유틸리티
 * 메모리 기반 (프로덕션에서는 Redis 등 사용 권장)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 사용 권장)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate Limit 체크
 * @param key 고유 키 (예: IP 주소, 사용자 ID)
 * @param maxRequests 최대 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns Rate Limit 초과 여부
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1분
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // 엔트리가 없거나 시간 윈도우가 지났으면 새로 생성
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true; // 허용
  }

  // 요청 수 증가
  entry.count++;

  // 최대 요청 수 초과 시
  if (entry.count > maxRequests) {
    return false; // 차단
  }

  return true; // 허용
}

/**
 * Rate Limit 엔트리 정리 (오래된 엔트리 삭제)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 주기적으로 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}
