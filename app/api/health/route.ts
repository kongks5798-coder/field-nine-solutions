import { NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Health Check API
 * 서버 및 데이터베이스 연결 상태 확인
 * 
 * GET /api/health
 */
export async function GET() {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        supabase: 'unknown',
      },
    };

    // Supabase 연결 테스트
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        health.services.database = 'error';
        health.services.supabase = 'error';
        health.status = 'degraded';
      } else {
        health.services.database = 'connected';
        health.services.supabase = 'connected';
      }
    } catch (error) {
      health.services.database = 'error';
      health.services.supabase = 'error';
      health.status = 'error';
    }

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
