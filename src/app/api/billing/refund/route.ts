import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';

const RefundSchema = z.object({
  reason: z.string().min(1).max(500).default('사용자 요청'),
});

// POST /api/billing/refund
// 가장 최근 결제 환불 (7일 이내만 허용)
export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = RefundSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : '사용자 요청';
  const uid = session.user.id;

  try {
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // 최근 결제 이벤트 조회 (7일 이내)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: event } = await admin
      .from('billing_events')
      .select('id, amount, created_at')
      .eq('user_id', uid)
      .eq('type', 'payment_succeeded')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!event) {
      return NextResponse.json({
        error: '환불 가능한 결제가 없습니다. 결제 후 7일 이내만 환불 가능합니다.',
      }, { status: 404 });
    }

    // 구독 조회
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, toss_payment_key')
      .eq('user_id', uid)
      .single();

    let refundDone = false;

    // Stripe 환불
    if (sub?.stripe_subscription_id) {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeKey);
        const invoices = await stripe.invoices.list({ subscription: sub.stripe_subscription_id, limit: 1 });
        const invoice = invoices.data[0] as unknown as Record<string, unknown> | undefined;
        const paymentIntent = invoice?.['payment_intent'];
        if (paymentIntent && typeof paymentIntent === 'string') {
          await stripe.refunds.create({ payment_intent: paymentIntent, reason: 'requested_by_customer' });
          refundDone = true;
        }
      }
    }

    // TossPayments 환불
    if (!refundDone && sub?.toss_payment_key) {
      const tossSecret = process.env.TOSSPAYMENTS_SECRET_KEY;
      if (tossSecret) {
        const authHeader = 'Basic ' + Buffer.from(tossSecret + ':').toString('base64');
        const res = await fetch(`https://api.tosspayments.com/v1/payments/${sub.toss_payment_key}/cancel`, {
          method: 'POST',
          headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelReason: reason }),
        });
        if (res.ok) refundDone = true;
      }
    }

    if (!refundDone) {
      return NextResponse.json({ error: '환불 처리에 실패했습니다. 고객센터에 문의해주세요.' }, { status: 500 });
    }

    // profiles 플랜 초기화
    await admin.from('profiles').update({ plan: null, plan_expires_at: null }).eq('id', uid);
    await admin.from('subscriptions').update({ status: 'refunded' }).eq('user_id', uid);

    // billing_events 기록
    await admin.from('billing_events').insert({
      user_id: uid,
      type: 'refund',
      amount: -event.amount,
      description: `환불 처리 완료: ${reason}`,
    });

    log.info('[refund] 환불 완료', { uid, amount: event.amount });
    return NextResponse.json({ message: `₩${event.amount.toLocaleString()} 환불이 처리되었습니다. 3-5 영업일 내 반영됩니다.` });
  } catch (err) {
    log.error('[refund] 처리 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '환불 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
