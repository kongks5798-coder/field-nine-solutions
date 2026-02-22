import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = adminClient();
  const uid = session.user.id;

  try {
    const [{ data: monthly, error: monthlyErr }, { data: events, error: eventsErr }] = await Promise.all([
      admin.from('monthly_usage')
        .select('billing_period, ai_calls, amount_krw, status, stripe_invoice_id')
        .eq('user_id', uid)
        .order('billing_period', { ascending: false })
        .limit(12),
      admin.from('billing_events')
        .select('id, type, amount, description, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (monthlyErr) log.warn('[billing/history] monthly_usage 조회 실패', { uid, error: monthlyErr.message });
    if (eventsErr)  log.warn('[billing/history] billing_events 조회 실패', { uid, error: eventsErr.message });

    return NextResponse.json({ monthly: monthly ?? [], events: events ?? [] });
  } catch (err) {
    log.error('[billing/history] 청구 내역 조회 실패', { uid, err: (err as Error).message });
    return NextResponse.json({ error: '청구 내역 조회 실패' }, { status: 500 });
  }
}
