import { NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';

/**
 * Health Check API
 * 서버 및 데이터베이스 연결 상태 확인
 */
export async function GET() {
  try {
    // Supabase 연결 테스트
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
