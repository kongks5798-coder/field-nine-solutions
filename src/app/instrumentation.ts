/**
 * Next.js Instrumentation Hook
 * Sentry 초기화 + Supabase 스키마 마이그레이션 자동 실행
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../../sentry.server.config');

    // SUPABASE_DATABASE_URL 설정 시 서버 시작 때 스키마 마이그레이션 자동 실행
    if (process.env.SUPABASE_DATABASE_URL) {
      try {
        const { runMigrations } = await import('@/lib/migrate');
        const results = await runMigrations();
        const applied = results.filter(r => r.status === 'ok');
        if (applied.length > 0) {
          console.log(`[migrate] ${applied.length}개 마이그레이션 완료:`, applied.map(r => r.label).join(', '));
        }
      } catch (err) {
        console.error('[migrate] 자동 마이그레이션 실패:', err);
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../../sentry.edge.config');
  }
}
