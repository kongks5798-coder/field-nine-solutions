import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_disabled');

const ALLOWED_PLANS = ['pro', 'team'] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get('session_id');

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL('/pricing?error=invalid', req.url));
  }

  // 현재 로그인된 사용자 확인 (Stripe metadata uid와 대조 필수)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', `/pricing`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/pricing?error=payment_failed', req.url));
    }

    const uid  = checkoutSession.metadata?.supabase_uid;
    const rawPlan = checkoutSession.metadata?.plan ?? '';

    // Stripe metadata uid가 현재 로그인 사용자와 일치하는지 검증 (IDOR 방지)
    if (!uid || uid !== session.user.id) {
      log.security('billing.success.uid_mismatch', {
        sessionUid: session.user.id,
        stripeUid:  uid ?? 'none',
        sessionId,
      });
      return NextResponse.redirect(new URL('/pricing?error=forbidden', req.url));
    }

    // plan 값 allowlist 검증
    const plan: string = ALLOWED_PLANS.includes(rawPlan as (typeof ALLOWED_PLANS)[number])
      ? rawPlan
      : 'pro';

    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // profiles.plan 즉시 업데이트 (webhook보다 빠르게)
    await admin.from('profiles').upsert(
      { id: uid, plan, plan_updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

    const res = NextResponse.redirect(new URL('/workspace?welcome=1', req.url));
    res.cookies.set('f9_sub', `${plan}|${Date.now()}`, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300, path: '/',
    });
    return res;
  } catch (err) {
    log.error('[billing/success] 처리 실패', { error: (err as Error).message });
    return NextResponse.redirect(new URL('/pricing?error=server', req.url));
  }
}
