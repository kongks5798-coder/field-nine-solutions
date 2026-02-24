import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';
import { SITE_URL } from '@/lib/constants';

// 충전 옵션 (원화 단위)
const TOP_UP_OPTIONS: Record<number, number> = {
  10000: 10000,  // ₩10,000 → 한도 ₩10,000 증가
  20000: 20000,  // ₩20,000 → 한도 ₩20,000 증가
  50000: 50000,  // ₩50,000 → 한도 ₩50,000 증가
};

const TopUpSchema = z.object({
  amount:   z.number().refine(v => v in TOP_UP_OPTIONS, { message: '유효하지 않은 충전 금액입니다.' }),
  provider: z.enum(['toss', 'stripe']).default('toss'),
});

// POST /api/billing/top-up → TossPayments 결제 URL 생성
export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = TopUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { amount, provider } = parsed.data;
  const uid = session.user.id;
  const orderId = `topup-${uid.slice(0, 8)}-${Date.now()}`;

  try {
    if (provider === 'toss') {
      const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY;
      if (!clientKey) {
        return NextResponse.json({ error: 'TossPayments 미설정' }, { status: 503 });
      }
      const origin = req.headers.get('origin') ?? SITE_URL;
      return NextResponse.json({
        provider: 'toss',
        clientKey,
        amount,
        orderId,
        orderName: `AI 크레딧 충전 ₩${(amount/1000).toFixed(0)}천`,
        successUrl: `${origin}/api/billing/top-up/confirm?amount=${amount}&orderId=${orderId}`,
        failUrl: `${origin}/billing?topup=fail`,
      });
    }

    // Stripe fallback
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe 미설정' }, { status: 503 });
    }
    const origin = req.headers.get('origin') ?? SITE_URL;
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);
    const sess = await stripe.checkout.sessions.create({
      mode:        'payment',
      currency:    'krw',
      line_items: [{
        price_data: {
          currency:     'krw',
          unit_amount:  amount,
          product_data: { name: `AI 크레딧 충전 ₩${(amount/1000).toFixed(0)}천` },
        },
        quantity: 1,
      }],
      metadata:   { user_id: uid, top_up_amount: String(amount) },
      success_url: `${origin}/api/billing/top-up/confirm?amount=${amount}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url:  `${origin}/billing?topup=cancel`,
    });
    return NextResponse.json({ provider: 'stripe', url: sess.url });
  } catch (err) {
    log.error('[top-up] 결제 세션 생성 실패', { error: (err as Error).message });
    return NextResponse.json({ error: '결제 세션 생성 실패' }, { status: 500 });
  }
}
