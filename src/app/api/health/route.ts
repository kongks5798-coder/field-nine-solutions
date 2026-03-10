/**
 * GET /api/health
 * Public endpoint — no auth required.
 * Used by uptime monitors, Vercel, and the /status page.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getEnvStatus } from '@/lib/validateEnv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const t = Date.now();
  try {
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    await sb.from('profiles').select('id').limit(1).maybeSingle();
    return { ok: true, latencyMs: Date.now() - t };
  } catch {
    return { ok: false, latencyMs: Date.now() - t };
  }
}

export async function GET() {
  const start = Date.now();
  const env = getEnvStatus();

  const envOk =
    env.supabase &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

  const db = await checkDatabase();

  const aiConfigured =
    env.anthropic ||
    env.openai ||
    !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  const allOk = envOk && db.ok;

  const body = {
    status: allOk ? 'ok' : db.ok ? 'degraded' : 'down',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    // 서비스별 연결 상태 (boolean — 값 노출 없음)
    services: {
      supabase: db.ok,
      ai: aiConfigured,
      email: env.resend,
      payments: env.tossPayments,
    },
    // 환경변수 설정 여부 (boolean — 값 노출 없음)
    env: {
      anthropic: env.anthropic,
      resend: env.resend,
      cron_secret: env.cronSecret,
    },
    // 상세 컴포넌트 상태 (기존 호환)
    components: {
      api:      { status: 'ok' },
      database: { status: db.ok ? 'ok' : 'error', latencyMs: db.latencyMs },
      env:      { status: envOk ? 'ok' : 'error' },
      ai:       { status: aiConfigured ? 'configured' : 'unconfigured' },
      billing:  { status: env.tossPayments ? 'configured' : 'unconfigured' },
      email:    { status: env.resend ? 'configured' : 'unconfigured' },
    },
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : db.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
