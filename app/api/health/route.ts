import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health Check Route - 시스템 상태 확인
 * 
 * 비즈니스 목적:
 * - 모니터링 시스템에서 헬스 체크
 * - 서비스 가용성 확인
 * - 의존성 상태 확인 (Supabase, Python Backend)
 */
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      python_backend: 'unknown',
    },
  };

  try {
    // Supabase 연결 확인
    const supabase = await createClient();
    const { error: dbError } = await supabase.from('subscription_plans').select('id').limit(1);
    health.services.database = dbError ? 'unhealthy' : 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
  }

  try {
    // Python 백엔드 연결 확인
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonBackendUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    health.services.python_backend = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.services.python_backend = 'unhealthy';
  }

  // 전체 상태 결정
  const allHealthy = Object.values(health.services).every(status => status === 'healthy');
  health.status = allHealthy ? 'healthy' : 'degraded';

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
