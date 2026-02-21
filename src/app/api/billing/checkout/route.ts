import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// 플랜별 Stripe Price ID (환경변수로 관리)
const STRIPE_PRICES: Record<string, { monthly: string; original: number; discounted: number }> = {
  core: {
    monthly:    process.env.STRIPE_PRICE_CORE_MONTHLY || '',
    original:   29000,
    discounted: 19900,
  },
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
  core: process.env.POLAR_CHECKOUT_URL_CORE || '',
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

  const body = await req.json();
  const { plan, provider = 'stripe' } = body as { plan: string; provider?: string };

  if (!STRIPE_PRICES[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const planInfo = STRIPE_PRICES[plan];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldnine.io';

  // ── Polar 결제 ─────────────────────────────────────────────────────────────
  if (provider === 'polar') {
    const polarUrl = POLAR_LINKS[plan];
    if (!polarUrl) return NextResponse.json({ error: 'Polar 미설정' }, { status: 400 });
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

  // Stripe Customer 생성/재사용
  let customerId: string = profile?.stripe_customer_id || '';
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.user_metadata?.name,
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

  return NextResponse.json({ url: checkoutSession.url });
}
