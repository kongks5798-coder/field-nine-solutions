/**
 * Edge-compatible in-memory rate limiter (sliding window)
 * 참고: Edge 런타임은 인스턴스별로 메모리를 공유하지 않으므로
 * 완벽한 분산 레이트 리미팅이 아니지만 단일 인스턴스 기본 보호 제공.
 * 프로덕션에서는 Upstash Redis 등을 사용하는 것을 권장.
 */

type WindowEntry = { count: number; resetAt: number };

// 전역 Map — Edge 인스턴스 내에서 공유
const store = new Map<string, WindowEntry>();

// 오래된 엔트리 주기적 정리 (메모리 누수 방지)
let lastCleanup = Date.now();
function maybeClean() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return; // 1분에 한 번
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix seconds
}

/**
 * @param key     레이트 리미팅 키 (예: "api:login:192.168.1.1")
 * @param limit   허용 횟수 (기본 10)
 * @param windowMs 윈도우 크기 ms (기본 60초)
 */
export function checkLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): RateLimitResult {
  maybeClean();

  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
  } else {
    entry.count += 1;
  }

  const remaining = Math.max(0, limit - entry.count);
  return {
    ok: entry.count <= limit,
    limit,
    remaining,
    resetAt: Math.ceil(entry.resetAt / 1000),
  };
}

/** 요청에서 클라이언트 IP 추출 */
export function ipFromHeaders(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||       // Cloudflare
    headers.get("x-real-ip") ||              // Nginx
    headers.get("x-forwarded-for")?.split(",")[0].trim() || // Proxy
    "unknown"
  );
}

/** Rate-limit 결과를 HTTP 헤더 맵으로 변환 */
export function headersFor(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset":     String(result.resetAt),
    ...(result.ok ? {} : { "Retry-After": String(result.resetAt - Math.floor(Date.now() / 1000)) }),
  };
}
