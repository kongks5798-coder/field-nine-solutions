import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * API Rate Limiting Middleware
 * 
 * 사용법:
 * export async function GET(request: NextRequest) {
 *   const rateLimited = await rateLimitMiddleware(request);
 *   if (rateLimited) return rateLimited;
 *   // ... API 로직
 * }
 */

export async function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1분
): Promise<NextResponse | null> {
  // IP 주소 추출
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
              request.headers.get('x-real-ip') ||
              'unknown';

  // Rate limit 체크
  const allowed = checkRateLimit(`api:${ip}`, maxRequests, windowMs);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null; // Rate limit 통과
}
