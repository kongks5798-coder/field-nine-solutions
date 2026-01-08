import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/utils/logger';

/**
 * 에러 리포트 수집 API
 * 클라이언트에서 발생한 에러를 서버로 전송
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // 에러 데이터 검증
    if (!errorData.message) {
      return NextResponse.json(
        { error: 'Invalid error data' },
        { status: 400 }
      );
    }

    // 에러 로깅 (향후 데이터베이스나 에러 추적 서비스로 전송)
    logger.error('Client error reported', new Error(errorData.message), {
      stack: errorData.stack,
      componentStack: errorData.componentStack,
      url: errorData.url,
      userAgent: errorData.userAgent,
    });

    // 성공 응답
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to process error report', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}
