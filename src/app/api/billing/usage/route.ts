/**
 * 사용량 기록 API
 * POST: 사용량 추가 (AI 호출, 스토리지 등)
 * GET:  현재 사용량 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', session.user.id)
    .in('status', ['active', 'trialing'])
    .single();

  const plan = sub?.plan || 'starter';
  const quotas = PLAN_QUOTAS[plan] || PLAN_QUOTAS.starter;

  const { data: records } = await admin
    .from('usage_records')
    .select('type, quantity')
    .eq('user_id', session.user.id)
    .eq('billing_period', period);

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

  // Pro/Team: 이번달 누적 요금 + 한도 조회
  const { data: monthUsage } = await admin
    .from('monthly_usage')
    .select('ai_calls, amount_krw, status')
    .eq('user_id', session.user.id)
    .eq('billing_period', period)
    .single();

  const { data: cap } = await admin
    .from('spending_caps')
    .select('monthly_limit, warn_threshold, hard_limit')
    .eq('user_id', session.user.id)
    .single();

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
  const { type, quantity = 1 } = body as { type?: string; quantity?: number };

  // 허용된 타입만 기록 (임의 타입 삽입 방지)
  const VALID_TYPES = ['ai_call', 'storage', 'api_call', 'export'] as const;
  if (!type || !(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }
  if (typeof quantity !== 'number' || quantity <= 0 || quantity > 10000) {
    return NextResponse.json({ error: 'quantity must be 1-10000' }, { status: 400 });
  }

  const admin  = adminClient();
  const period = new Date().toISOString().slice(0, 7);

  await admin.from('usage_records').insert({
    user_id:        session.user.id,
    type,
    quantity,
    unit_price:     UNIT_PRICES[type] || 0,
    billed:         false,
    billing_period: period,
  });

  // 스타터 100회 초과 시 경고 반환
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan')
    .eq('user_id', session.user.id)
    .single();
  const plan = sub?.plan || 'starter';
  const quota = PLAN_QUOTAS[plan]?.[type] ?? Infinity;

  if (isFinite(quota)) {
    const { data: records } = await admin
      .from('usage_records')
      .select('quantity')
      .eq('user_id', session.user.id)
      .eq('type', type)
      .eq('billing_period', period);
    const total = (records || []).reduce((s, r) => s + r.quantity, 0);
    if (total > quota) {
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
}
