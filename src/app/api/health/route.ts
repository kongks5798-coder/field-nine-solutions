/**
 * GET /api/health
 * Public endpoint — no auth required.
 * Used by uptime monitors, Vercel, and the /status page.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  const envOk =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const db = await checkDatabase();

  const aiConfigured =
    !!process.env.OPENAI_API_KEY ||
    !!process.env.ANTHROPIC_API_KEY ||
    !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  const billingConfigured = !!process.env.STRIPE_SECRET_KEY || !!process.env.TOSSPAYMENTS_SECRET_KEY;

  const allOk = envOk && db.ok;

  const body = {
    status: allOk ? 'ok' : db.ok ? 'degraded' : 'down',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    components: {
      api:     { status: 'ok' },
      database: { status: db.ok ? 'ok' : 'error', latencyMs: db.latencyMs },
      env:     { status: envOk ? 'ok' : 'error' },
      ai:      { status: aiConfigured ? 'configured' : 'unconfigured' },
      billing: { status: billingConfigured ? 'configured' : 'unconfigured' },
      email:   { status: !!process.env.RESEND_API_KEY ? 'configured' : 'unconfigured' },
    },
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : db.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
