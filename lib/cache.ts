/**
 * 간단한 메모리 기반 캐싱 유틸리티
 * 프로덕션에서는 Redis 사용 권장
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * 캐시에서 데이터 가져오기
 */
export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  
  if (!entry) {
    return null;
  }

  // 만료 확인
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * 캐시에 데이터 저장
 * @param key 캐시 키
 * @param data 저장할 데이터
 * @param ttlSeconds TTL (초 단위, 기본값: 300초 = 5분)
 */
export function setCache<T>(key: string, data: T, ttlSeconds: number = 300): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cacheStore.set(key, {
    data,
    expiresAt,
  });
}

/**
 * 캐시 삭제
 */
export function deleteCache(key: string): void {
  cacheStore.delete(key);
}

/**
 * 캐시 전체 삭제
 */
export function clearCache(): void {
  cacheStore.clear();
}

/**
 * 만료된 캐시 정리
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiresAt) {
      cacheStore.delete(key);
    }
  }
}

// 주기적으로 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}
