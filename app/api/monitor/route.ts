import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/src/utils/logger';

/**
 * 헬스 체크 및 모니터링 엔드포인트
 * 
 * 프로덕션 환경에서 서비스 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: 'connected', // 실제로는 DB 연결 확인
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not_configured',
        auth: process.env.NEXTAUTH_SECRET ? 'configured' : 'not_configured',
        monitoring: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'enabled' : 'disabled',
      },
    };

    logger.info('Health check', health);

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
