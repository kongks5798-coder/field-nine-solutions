import { NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 통합 테스트 API
 * GET /api/test
 * 
 * 모든 주요 기능의 연결 상태를 확인
 */

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    tests: {},
  };

  // 1. Supabase 연결 테스트
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    results.tests.supabase = {
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Connected',
    };
  } catch (error: any) {
    results.tests.supabase = {
      status: 'error',
      message: error.message,
    };
    results.status = 'error';
  }

  // 2. 인증 테스트
  try {
    const user = await getCurrentUser();
    results.tests.authentication = {
      status: user ? 'ok' : 'no_session',
      message: user ? 'User authenticated' : 'No active session',
    };
  } catch (error: any) {
    results.tests.authentication = {
      status: 'error',
      message: error.message,
    };
  }

  // 3. 환경 변수 확인
  results.tests.environment = {
    status: 'ok',
    variables: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      tossClientKey: process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY ? 'set' : 'missing',
      tossSecretKey: process.env.TOSS_PAYMENTS_SECRET_KEY ? 'set' : 'missing',
      googleClientId: process.env.GOOGLE_CLIENT_ID ? 'set' : 'missing',
      kakaoClientId: process.env.KAKAO_CLIENT_ID ? 'set' : 'missing',
      geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY ? 'set' : 'missing',
      openaiApiKey: process.env.OPENAI_API_KEY ? 'set' : 'missing',
    },
  };

  // 4. 데이터베이스 테이블 확인
  try {
    const supabase = await createClient();
    const tables = ['users', 'subscriptions', 'orders', 'products'];
    const tableStatus: Record<string, string> = {};

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        tableStatus[table] = error ? 'error' : 'ok';
      } catch {
        tableStatus[table] = 'error';
      }
    }

    results.tests.database = {
      status: Object.values(tableStatus).every(s => s === 'ok') ? 'ok' : 'partial',
      tables: tableStatus,
    };
  } catch (error: any) {
    results.tests.database = {
      status: 'error',
      message: error.message,
    };
  }

  const hasErrors = Object.values(results.tests).some(
    (test: any) => test.status === 'error'
  );

  return NextResponse.json(results, {
    status: hasErrors ? 500 : 200,
  });
}
