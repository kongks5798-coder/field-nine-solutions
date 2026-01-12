import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { validateAnalyzeRequest } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { canPerformAnalysis, incrementUsage } from '@/lib/subscription-trendstream';

/**
 * Analyze API Route - Python 백엔드와 통신
 * 
 * 비즈니스 목적:
 * - 프론트엔드에서 Python 백엔드로 분석 요청 전달
 * - 분석 결과를 클라이언트에 반환
 * - 에러 핸들링 및 타임아웃 관리
 * - Rate Limiting 및 Input Validation으로 보안 강화
 */
export async function POST(request: NextRequest) {
  try {
    // Rate Limiting 체크
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: 60,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
          },
        }
      );
    }

    const body = await request.json();
    
    // Input Validation
    const validation = validateAnalyzeRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { hashtag, platform, max_posts } = validation.data!;

    // 인증 확인 및 사용량 제한 체크
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // 사용량 제한 확인
      const limitCheck = await canPerformAnalysis(user.id);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: limitCheck.reason || '월간 분석 한도를 초과했습니다.',
            usage: limitCheck.usage,
            upgrade_required: true,
          },
          { status: 403 }
        );
      }
    }

    // Python 백엔드 URL (환경 변수에서 가져오기)
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    // Python 백엔드에 요청 전달
    logger.info('Analysis request', { hashtag, platform, max_posts, clientId });
    
    const startTime = Date.now();
    const response = await fetch(`${pythonBackendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hashtag,
        platform,
        max_posts,
      }),
      // 타임아웃: 30초 (분석은 시간이 걸릴 수 있음)
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || '분석 중 오류가 발생했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    logger.info('Analysis completed', { 
      hashtag, 
      duration: `${duration}ms`,
      analyzed_posts: data.analyzed_posts,
    });

    // 사용량 증가 (인증된 사용자만)
    if (user) {
      await incrementUsage(user.id);
    }

    // 결과 변환 (Python 백엔드 형식 → 프론트엔드 형식)
    return NextResponse.json(
      {
        hashtag: data.hashtag,
        colors: data.top_colors || [],
        items: data.top_items || [],
        confidence: data.confidence || 0,
        analyzed_posts: data.analyzed_posts || 0,
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error: any) {
    logger.error('Analyze API Error', { 
      error: error.message,
      stack: error.stack,
      clientId,
    });

    // 타임아웃 에러
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: '분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' },
        { status: 504 }
      );
    }

    // 네트워크 에러 (Python 백엔드가 실행되지 않음)
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'AI 분석 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '알 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
