import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';
import { validateEnv } from '@/lib/env';
import { log } from '@/lib/logger';

const CheckoutSchema = z.object({
  plan:     z.enum(['pro', 'team']),
  provider: z.enum(['stripe', 'toss', 'polar']).optional().default('stripe'),
});
validateEnv();

if (!process.env.STRIPE_SECRET_KEY) {
  log.warn('[Checkout] STRIPE_SECRET_KEY 미설정 — Stripe 결제 비활성화');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_disabled');

// 플랜별 Stripe Price ID (환경변수로 관리)
const STRIPE_PRICES: Record<string, { monthly: string; original: number; discounted: number }> = {
  pro: {
    monthly:    process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    original:   49000,   // 정가
    discounted: 39000,   // 할인가
  },
  team: {
    monthly:    process.env.STRIPE_PRICE_TEAM_MONTHLY || '',
    original:   129000,
    discounted: 99000,
  },
};

// Polar 결제 링크 (환경변수)
const POLAR_LINKS: Record<string, string> = {
  pro:  process.env.POLAR_CHECKOUT_URL_PRO  || '',
  team: process.env.POLAR_CHECKOUT_URL_TEAM || '',
};

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

  const body = await req.json().catch(() => ({}));
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'plan은 pro 또는 team이어야 합니다.' }, { status: 400 });
  }
  const { plan, provider } = parsed.data;

  const planInfo = STRIPE_PRICES[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldnine.io';

  // ── Polar 결제 ─────────────────────────────────────────────────────────────
  if (provider === 'polar') {
    const polarUrl = POLAR_LINKS[plan];
    if (!polarUrl) return NextResponse.json({ error: 'Polar 미설정' }, { status: 400 });
    if (!polarUrl.startsWith('https://')) {
      log.error('[Checkout] Polar URL이 유효하지 않음', { plan, polarUrl: polarUrl.slice(0, 30) });
      return NextResponse.json({ error: 'Polar 결제 URL 설정 오류' }, { status: 500 });
    }
    const url = new URL(polarUrl);
    url.searchParams.set('customer_email', session.user.email!);
    url.searchParams.set('metadata[supabase_uid]', session.user.id);
    url.searchParams.set('metadata[plan]', plan);
    return NextResponse.json({ url: url.toString() });
  }

  // ── Stripe 결제 ────────────────────────────────────────────────────────────
  if (!process.env.STRIPE_SECRET_KEY || !planInfo.monthly) {
    return NextResponse.json({ error: 'Stripe 미설정 — 관리자에게 문의하세요.' }, { status: 503 });
  }

  const admin = adminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single();

  const userEmail = session.user.email;
  if (!userEmail) {
    return NextResponse.json({ error: '이메일 정보가 없습니다. 계정을 확인해주세요.' }, { status: 400 });
  }

  // Stripe Customer 생성/재사용
  let customerId: string = profile?.stripe_customer_id || '';
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: session.user.user_metadata?.name as string | undefined,
      metadata: { supabase_uid: session.user.id },
      preferred_locales: ['ko'],
    });
    customerId = customer.id;
    await admin.from('profiles').upsert(
      { id: session.user.id, stripe_customer_id: customerId },
      { onConflict: 'id' }
    );
  }

  // Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planInfo.monthly, quantity: 1 }],
    success_url: `${appUrl}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/pricing?canceled=1`,
    locale: 'ko',
    subscription_data: {
      metadata: {
        supabase_uid:     session.user.id,
        plan,
        original_price:  String(planInfo.original),
        discounted_price: String(planInfo.discounted),
      },
    },
    // 사용량 초과 자동결제를 위한 메타데이터
    metadata: {
      supabase_uid: session.user.id,
      plan,
    },
    // 할인가 표시
    invoice_creation: { enabled: true },
  });

  log.billing('checkout.created', { plan, provider: 'stripe', uid: session.user.id });
  return NextResponse.json({ url: checkoutSession.url });
}
