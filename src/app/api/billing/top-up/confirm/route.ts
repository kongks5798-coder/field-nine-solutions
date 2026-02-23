import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';
import { TOSS_API_BASE } from '@/lib/constants';

const VALID_AMOUNTS = [10000, 20000, 50000];

// GET /api/billing/top-up/confirm?amount=10000&paymentKey=...&orderId=...
// TossPayments 또는 Stripe 결제 확인 후 spending_cap 증액
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const amountStr   = searchParams.get('amount') ?? '';
  const paymentKey  = searchParams.get('paymentKey') ?? '';
  const orderId     = searchParams.get('orderId') ?? '';
  const sessionId   = searchParams.get('session_id') ?? '';   // Stripe
  const provider    = searchParams.get('provider') ?? 'toss';

  const amount = Number(amountStr);
  if (!VALID_AMOUNTS.includes(amount)) {
    return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
  }

  const origin = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  try {
    if (provider === 'stripe' && sessionId) {
      // Stripe 세션 검증
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey);
      const sess = await stripe.checkout.sessions.retrieve(sessionId);
      if (sess.payment_status !== 'paid') {
        return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
      }
      const uid = sess.metadata?.user_id;
      if (!uid) return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
      await incrementSpendingCap(uid, amount);
      return NextResponse.redirect(new URL(`/billing?topup=success&amount=${amount}`, req.url));
    }

    // TossPayments 결제 확인
    if (!paymentKey || !orderId) {
      return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
    }
    const tossSecret = process.env.TOSSPAYMENTS_SECRET_KEY;
    if (!tossSecret) return NextResponse.redirect(new URL('/billing?topup=fail', req.url));

    const authHeader = 'Basic ' + Buffer.from(tossSecret + ':').toString('base64');
    const tossRes = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    if (!tossRes.ok) {
      log.error('[top-up/confirm] TossPayments 확인 실패', { status: tossRes.status });
      return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
    }

    // orderId 형식: topup-{uid_8chars}-{timestamp}
    const uidPrefix = orderId.split('-')[1] ?? '';

    // service_role로 user_id 조회
    const adminSb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { data: profile } = await adminSb
      .from('profiles').select('id').like('id', `${uidPrefix}%`).single();
    if (!profile?.id) {
      return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
    }

    await incrementSpendingCap(profile.id, amount);
    return NextResponse.redirect(new URL(`/billing?topup=success&amount=${amount}`, req.url));
  } catch (err) {
    log.error('[top-up/confirm] 처리 실패', { error: (err as Error).message });
    return NextResponse.redirect(new URL('/billing?topup=fail', req.url));
  }
}

async function incrementSpendingCap(uid: string, amount: number) {
  const adminSb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 현재 cap 조회
  const { data: cap } = await adminSb
    .from('spending_caps').select('hard_limit, warn_threshold').eq('user_id', uid).single();

  const currentLimit = cap?.hard_limit ?? 50000;
  const newLimit = currentLimit + amount;

  await adminSb.from('spending_caps').upsert({
    user_id:        uid,
    hard_limit:     newLimit,
    warn_threshold: Math.floor(newLimit * 0.85),
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // billing_events 기록
  await adminSb.from('billing_events').insert({
    user_id:     uid,
    type:        'top_up',
    amount:      amount,
    description: `AI 크레딧 충전 ₩${(amount/1000).toFixed(0)}천 → 한도 ₩${(newLimit/1000).toFixed(0)}천으로 증가`,
  });

  log.info('[top-up] 한도 증액 완료', { uid, amount, newLimit });
}
