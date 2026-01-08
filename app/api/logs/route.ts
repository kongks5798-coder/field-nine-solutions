import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/utils/logger';

/**
 * 로그 수집 API
 * 클라이언트에서 발생한 에러를 서버로 전송
 */
export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // 로그 데이터 검증
    if (!logData.message || !logData.level) {
      return NextResponse.json(
        { error: 'Invalid log data' },
        { status: 400 }
      );
    }

    // 로그 저장 (향후 데이터베이스나 로깅 서비스로 전송)
    logger.info('Client log received', {
      level: logData.level,
      message: logData.message,
      context: logData.context,
      url: logData.url,
    });

    // 성공 응답
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to process log', error);
    return NextResponse.json(
      { error: 'Failed to process log' },
      { status: 500 }
    );
  }
}
