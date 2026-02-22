/**
 * 구독 취소 + 환불 계산 API
 *
 * 환불 정책 (Replit 방식):
 *  - 기본 환불: (남은 일수 / 30) × 월 결제금액
 *  - 차감: 당월 초과 사용량 금액 (AI 호출 초과 등)
 *  - 최종 환불 = max(0, 기본환불 - 초과사용금액)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';
import { z } from 'zod';

const CancelSchema = z.object({ preview: z.boolean().optional().default(false) });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const FREE_QUOTA: Record<string, number> = {
  starter: 100,
  pro:     Infinity,
  team:    Infinity,
};
const AI_OVERAGE_UNIT = 90;    // ₩90 per AI call over quota

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = adminClient();

  // 현재 구독 조회
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!sub) return NextResponse.json({ error: '활성 구독 없음' }, { status: 404 });

  // ── 남은 일수 계산 ────────────────────────────────────────────────────────
  const now         = new Date();
  const periodEnd   = new Date(sub.current_period_end);
  const periodStart = new Date(sub.current_period_start);
  const totalDays   = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000));
  const remainDays  = Math.max(0, Math.round((periodEnd.getTime() - now.getTime()) / 86400000));
  const baseRefund  = Math.round((remainDays / totalDays) * (sub.discounted_price || 0));

  // ── 당월 초과 사용량 ──────────────────────────────────────────────────────
  const period = now.toISOString().slice(0, 7);
  const { data: usageRows } = await admin
    .from('usage_records')
    .select('type, quantity, unit_price')
    .eq('user_id', session.user.id)
    .eq('billing_period', period)
    .eq('billed', false);

  let overageAmount = 0;
  const quota = FREE_QUOTA[sub.plan] || 0;
  let aiCalls = 0;

  for (const r of (usageRows || [])) {
    if (r.type === 'ai_call') {
      aiCalls += r.quantity;
    }
  }

  const aiOverage = Math.max(0, aiCalls - (isFinite(quota) ? quota : 0));
  overageAmount += aiOverage * AI_OVERAGE_UNIT;

  // ── 최종 환불액 ───────────────────────────────────────────────────────────
  const refundAmount = Math.max(0, baseRefund - overageAmount);

  const { preview } = CancelSchema.parse(await req.json().catch(() => ({})));

  // 미리보기 모드 (실제 취소 안 함)
  if (preview) {
    return NextResponse.json({
      remainDays,
      totalDays,
      baseRefund,
      overageAmount,
      aiCalls,
      aiOverage,
      refundAmount,
      plan: sub.plan,
      periodEnd: sub.current_period_end,
    });
  }

  // ── 실제 취소 처리 ────────────────────────────────────────────────────────
  if (sub.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    // 즉시 취소 (환불 있으면) vs 기간 말 취소
    if (refundAmount > 0) {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);

      // Stripe 환불 발행
      const invoices = await stripe.invoices.list({
        subscription: sub.stripe_subscription_id,
        limit: 1,
        status: 'paid',
      });
      // Stripe newer SDK: expand payment_intent via charges
      const latestInv = invoices.data[0] as unknown as { payment_intent?: string | { id: string } } | undefined;
      const piRaw = latestInv?.payment_intent;
      const piId  = typeof piRaw === 'string' ? piRaw : (piRaw as { id: string } | undefined)?.id;
      if (piId) {
        try {
          await stripe.refunds.create({
            payment_intent: piId,
            amount: refundAmount,
            reason: 'requested_by_customer',
          });
        } catch {}
      }
    } else {
      // 환불 없으면 기간 말 취소
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }
  }

  // DB 업데이트
  await admin.from('subscriptions')
    .update({
      status: refundAmount > 0 ? 'canceled' : 'active',
      cancel_at_period_end: refundAmount <= 0,
      canceled_at: refundAmount > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  if (refundAmount > 0) {
    await admin.from('profiles').upsert(
      { id: session.user.id, plan: null, plan_updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  }

  await admin.from('billing_events').insert({
    user_id:     session.user.id,
    type:        'subscription_canceled',
    amount:      -refundAmount,
    description: refundAmount > 0
      ? `구독 취소 및 환불: ₩${refundAmount.toLocaleString()}`
      : '구독 취소 (기간 말 적용, 환불 없음)',
    metadata: { baseRefund, overageAmount, refundAmount, remainDays },
  });

  return NextResponse.json({
    success: true,
    refundAmount,
    message: refundAmount > 0
      ? `₩${refundAmount.toLocaleString()}이 3~5 영업일 내 환불됩니다.`
      : '구독이 현재 기간 말에 종료됩니다.',
  });
}
