/**
 * Rate Limiting - API 요청 제한
 * 
 * 비즈니스 목적:
 * - API 남용 방지
 * - 서버 리소스 보호
 * - 공정한 사용 보장
 */
import { NextRequest } from 'next/server';

// 간단한 메모리 기반 Rate Limiter (프로덕션에서는 Redis 사용 권장)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 10, // 최대 10회 요청
};

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // 새로운 윈도우 시작
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // 요청 카운트 증가
  record.count++;
  requestCounts.set(identifier, record);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - record.count,
  };
}

export function getClientIdentifier(request: NextRequest): string {
  // IP 주소 기반 식별 (프로덕션에서는 사용자 ID도 고려)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}
