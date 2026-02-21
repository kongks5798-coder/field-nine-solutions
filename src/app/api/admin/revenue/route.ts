/**
 * GET /api/admin/revenue
 * 관리자 전용 수익 현황 API (ADMIN_SECRET 헤더 인증)
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { validateEnv } from '@/lib/env';
import { log } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase-admin';
validateEnv();

export async function GET(req: NextRequest) {
  const secret   = req.headers.get('x-admin-secret') ?? '';
  const expected = process.env.ADMIN_SECRET ?? '';
  // 타이밍 어택 방지: constant-time 비교
  const isValid = expected.length > 0 &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
  if (!isValid) {
    log.security('admin.revenue.unauthorized', { ip: req.headers.get('x-forwarded-for') ?? 'unknown' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdminClient();
  const period = new Date().toISOString().slice(0, 7);
  const lastPeriod = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString().slice(0, 7);

  let totalUsers: number | null, proUsers: number | null, teamUsers: number | null;
  let thisMonth: { amount_krw: number | null }[] | null;
  let lastMonth: { amount_krw: number | null }[] | null;
  let outstanding: { amount_krw: number | null; user_id: string }[] | null;
  let recentEvents: { type: string; amount: number; description: string; created_at: string }[] | null;

  try {
    [
      { count: totalUsers },
      { count: proUsers },
      { count: teamUsers },
      { data: thisMonth },
      { data: lastMonth },
      { data: outstanding },
      { data: recentEvents },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'team'),
      admin.from('monthly_usage').select('amount_krw').eq('billing_period', period).eq('status', 'open'),
      admin.from('monthly_usage').select('amount_krw').eq('billing_period', lastPeriod).eq('status', 'paid'),
      admin.from('monthly_usage').select('amount_krw, user_id').eq('status', 'failed'),
      admin.from('billing_events')
        .select('type, amount, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);
  } catch (err) {
    log.error('[admin/revenue] DB 조회 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
  }

  const thisMonthRevenue = (thisMonth ?? []).reduce((s: number, r: { amount_krw: number | null }) => s + (r.amount_krw ?? 0), 0);
  const lastMonthRevenue = (lastMonth ?? []).reduce((s: number, r: { amount_krw: number | null }) => s + (r.amount_krw ?? 0), 0);
  const outstandingAmount = (outstanding ?? []).reduce((s: number, r: { amount_krw: number | null }) => s + (r.amount_krw ?? 0), 0);

  return NextResponse.json({
    users: {
      total: totalUsers ?? 0,
      pro:   proUsers  ?? 0,
      team:  teamUsers ?? 0,
      free:  (totalUsers ?? 0) - (proUsers ?? 0) - (teamUsers ?? 0),
    },
    revenue: {
      thisMonth:   thisMonthRevenue,
      lastMonth:   lastMonthRevenue,
      outstanding: outstandingAmount,
      failedCount: (outstanding ?? []).length,
    },
    recentEvents: recentEvents ?? [],
  });
}
