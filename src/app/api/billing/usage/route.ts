/**
 * 사용량 기록 API
 * POST: 사용량 추가 (AI 호출, 스토리지 등)
 * GET:  현재 사용량 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

const UsagePostSchema = z.object({
  type:     z.enum(['ai_call', 'storage', 'api_call', 'export']),
  quantity: z.number().int().min(1).max(10000).optional().default(1),
});

const PLAN_QUOTAS: Record<string, Record<string, number>> = {
  starter: { ai_call: 100, storage_gb: 1 },
  pro:     { ai_call: Infinity, storage_gb: 50 },
  team:    { ai_call: Infinity, storage_gb: 200 },
};

const UNIT_PRICES: Record<string, number> = {
  ai_call:    90,    // ₩90/회 초과분
  storage_gb: 900,   // ₩900/GB 초과분
};

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// ── 사용량 조회 ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = adminClient();
  const period = new Date().toISOString().slice(0, 7);

  // 두 독립 쿼리를 병렬 실행 (N+1 최적화)
  const [{ data: sub }, { data: records }] = await Promise.all([
    admin.from('subscriptions').select('plan, status').eq('user_id', session.user.id).in('status', ['active', 'trialing']).single(),
    admin.from('usage_records').select('type, quantity').eq('user_id', session.user.id).eq('billing_period', period),
  ]);

  const plan = sub?.plan || 'starter';
  const quotas = PLAN_QUOTAS[plan] || PLAN_QUOTAS.starter;

  const usage: Record<string, number> = {};
  for (const r of (records || [])) {
    usage[r.type] = (usage[r.type] || 0) + r.quantity;
  }

  const result: Record<string, { used: number; quota: number; overage: number; overageCost: number }> = {};
  for (const [type, quota] of Object.entries(quotas)) {
    const used    = usage[type] || 0;
    const overage = Math.max(0, isFinite(quota) ? used - quota : 0);
    result[type] = {
      used,
      quota,
      overage,
      overageCost: overage * (UNIT_PRICES[type] || 0),
    };
  }

  // Pro/Team: 이번달 누적 요금 + 한도 조회 — 병렬 실행 (N+1 최적화)
  const [{ data: monthUsage }, { data: cap }] = await Promise.all([
    admin.from('monthly_usage').select('ai_calls, amount_krw, status').eq('user_id', session.user.id).eq('billing_period', period).single(),
    admin.from('spending_caps').select('monthly_limit, warn_threshold, hard_limit').eq('user_id', session.user.id).single(),
  ]);

  log.billing('usage.get', { userId: session.user.id, plan, period });

  return NextResponse.json({
    plan, period, usage: result,
    metered: {
      amount_krw:     monthUsage?.amount_krw   ?? 0,
      ai_calls:       monthUsage?.ai_calls     ?? 0,
      status:         monthUsage?.status       ?? 'open',
      monthly_limit:  cap?.monthly_limit       ?? 50000,
      warn_threshold: cap?.warn_threshold      ?? 40000,
      hard_limit:     cap?.hard_limit          ?? 50000,
    },
  });
}

// ── 사용량 기록 ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = UsagePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'type은 ai_call/storage/api_call/export, quantity는 1-10000' }, { status: 400 });
  }
  const { type, quantity } = parsed.data;

  try {
  const admin  = adminClient();
  const period = new Date().toISOString().slice(0, 7);

  // insert + subscriptions 조회 병렬 실행 (N+1 최적화)
  const [, { data: sub }] = await Promise.all([
    admin.from('usage_records').insert({
      user_id:        session.user.id,
      type,
      quantity,
      unit_price:     UNIT_PRICES[type] || 0,
      billed:         false,
      billing_period: period,
    }),
    admin.from('subscriptions').select('plan').eq('user_id', session.user.id).single(),
  ]);
  const plan = sub?.plan || 'starter';
  const quota = PLAN_QUOTAS[plan]?.[type] ?? Infinity;

  if (isFinite(quota)) {
    // DB SUM 집계로 모든 레코드를 메모리로 로드하는 비효율 제거
    const { data: sumData } = await admin.rpc('sum_usage', {
      p_user_id:        session.user.id,
      p_type:           type,
      p_billing_period: period,
    }).single() as { data: { total: number } | null };

    // RPC 미존재 시 폴백: count 쿼리로 대체
    let total: number;
    if (sumData?.total !== undefined) {
      total = sumData.total;
    } else {
      const { count } = await admin
        .from('usage_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('type', type)
        .eq('billing_period', period);
      total = count ?? 0;
    }
    if (total > quota) {
      log.billing('usage.overage', { userId: session.user.id, type, total, quota });
      return NextResponse.json({
        recorded: true,
        overage: true,
        overageCount: total - quota,
        overageCost: (total - quota) * (UNIT_PRICES[type] || 0),
        message: `무료 한도 초과 (${total}/${quota}회). 초과분은 월말 자동 청구됩니다.`,
      });
    }
  }

  return NextResponse.json({ recorded: true, overage: false });
  } catch (err) {
    log.error('[usage] 사용량 기록 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '사용량 기록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
