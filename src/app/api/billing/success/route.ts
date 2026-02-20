import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get('session_id');
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldnine.io';

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(new URL('/pricing?error=invalid', req.url));
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/pricing?error=payment_failed', req.url));
    }

    const uid  = checkoutSession.metadata?.supabase_uid;
    const plan = checkoutSession.metadata?.plan || 'pro';

    if (uid) {
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
    }

    const res = NextResponse.redirect(new URL('/workspace?welcome=1', req.url));
    res.cookies.set('f9_sub', `${plan}|${Date.now()}`, {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300, path: '/',
    });
    return res;
  } catch (err) {
    console.error('[billing/success]', err);
    return NextResponse.redirect(new URL('/pricing?error=server', req.url));
  }
}
