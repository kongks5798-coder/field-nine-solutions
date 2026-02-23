import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';
import { TOSS_API_BASE } from '@/lib/constants';

// POST /api/billing/downgrade
// 현재 플랜을 starter로 다운그레이드 (다음 청구 주기부터 적용)
export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uid = session.user.id;

  try {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // 현재 구독 조회
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id, plan, status, stripe_subscription_id, toss_payment_key')
      .eq('user_id', uid)
      .eq('status', 'active')
      .single();

    if (!sub) return NextResponse.json({ error: '활성 구독이 없습니다.' }, { status: 404 });

    // Stripe 구독 취소 (period_end에 취소)
    if (sub.stripe_subscription_id) {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }
    }

    // TossPayments 취소
    if (sub.toss_payment_key) {
      const tossSecret = process.env.TOSSPAYMENTS_SECRET_KEY;
      if (tossSecret) {
        const authHeader = 'Basic ' + Buffer.from(tossSecret + ':').toString('base64');
        await fetch(`${TOSS_API_BASE}/payments/${sub.toss_payment_key}/cancel`, {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelReason: '사용자 다운그레이드 요청' }),
        });
      }
    }

    // DB 업데이트: cancel_at_period_end 표시
    await admin.from('subscriptions').update({
      status: 'cancel_at_period_end',
      updated_at: new Date().toISOString(),
    }).eq('id', sub.id);

    // billing_events 기록
    await admin.from('billing_events').insert({
      user_id: uid,
      type: 'subscription_downgrade_scheduled',
      amount: 0,
      description: `${sub.plan} → starter 다운그레이드 예약 (현재 기간 종료 후 적용)`,
    });

    log.info('[downgrade] 다운그레이드 예약 완료', { uid, plan: sub.plan });
    return NextResponse.json({
      message: '현재 구독 기간 종료 후 무료 플랜으로 전환됩니다.',
      effectiveDate: '다음 청구 주기',
    });
  } catch (err) {
    log.error('[downgrade] 처리 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '다운그레이드 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
