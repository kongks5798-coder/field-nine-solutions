import { NextResponse } from 'next/server';
import { createClient } from '@/src/utils/supabase/server';

/**
 * Connection Test API
 * Supabase 연결 및 데이터베이스 접근 테스트
 */
export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'testing',
    checks: {},
  };

  try {
    // 1. Supabase 클라이언트 생성 테스트
    try {
      const supabase = await createClient();
      results.checks.supabase_client = { status: 'ok', message: 'Client created successfully' };
    } catch (error) {
      results.checks.supabase_client = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      throw error;
    }

    // 2. 데이터베이스 연결 테스트 (products 테이블)
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);

      if (error) {
        results.checks.database_connection = {
          status: 'error',
          message: error.message,
          code: error.code,
        };
      } else {
        results.checks.database_connection = {
          status: 'ok',
          message: 'Database connection successful',
        };
      }
    } catch (error) {
      results.checks.database_connection = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 3. 환경 변수 확인
    results.checks.environment_variables = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
    };

    // 4. 전체 상태 결정
    const hasErrors = Object.values(results.checks).some(
      (check: any) => check.status === 'error'
    );
    const hasMissingEnv = Object.values(results.checks.environment_variables).some(
      (value) => value === 'missing'
    );

    if (hasErrors || hasMissingEnv) {
      results.status = 'partial';
      return NextResponse.json(results, { status: 200 });
    }

    results.status = 'ok';
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    results.status = 'error';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
}
