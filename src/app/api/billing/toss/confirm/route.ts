import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';
import { PLAN_VALID_AMOUNTS } from '@/lib/plans';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get('paymentKey');
  const orderId    = searchParams.get('orderId');
  const amount     = searchParams.get('amount');
  const plan       = (searchParams.get('plan') || 'pro') as 'pro' | 'team';

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL('/pricing?canceled=1', req.url));
  }

  // 금액 위변조 검증
  const amountNum = Number(amount);
  const validAmounts = PLAN_VALID_AMOUNTS[plan] ?? [];
  if (!validAmounts.includes(amountNum)) {
    log.error('[Toss confirm] 금액 위변조 감지', { plan, amount: amountNum, orderId });
    return NextResponse.redirect(new URL('/pricing?error=toss_invalid_amount', req.url));
  }

  // TossPayments 서버 승인
  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;
  if (!secretKey) {
    log.error('[Toss confirm] TOSSPAYMENTS_SECRET_KEY 미설정');
    return NextResponse.redirect(new URL('/pricing?error=toss_config', req.url));
  }

  const encoded = Buffer.from(`${secretKey}:`).toString('base64');

  let payment: Record<string, unknown>;
  try {
    const confirmRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: amountNum }),
    });

    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      log.error('[Toss confirm] 승인 실패', { err, orderId });
      return NextResponse.redirect(new URL('/pricing?error=toss_failed', req.url));
    }

    payment = await confirmRes.json();
  } catch (err) {
    log.error('[Toss confirm] 네트워크 오류', { err });
    return NextResponse.redirect(new URL('/pricing?error=toss_network', req.url));
  }

  log.billing('toss.confirm', { orderId, plan, amount: amountNum, status: payment.status });

  // orderId 형식: order_{userId8}_{timestamp}
  const parts = orderId.split('_');
  const userIdPrefix = parts[1] ?? '';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // userId 접두어로 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('id', `${userIdPrefix}%`)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', profile.id);

    await supabase.from('usage_records').insert({
      user_id: profile.id,
      type: 'subscription',
      amount: amountNum,
      billing_period: new Date().toISOString().slice(0, 7),
      billed: true,
    });
  } else {
    log.error('[Toss confirm] 프로필을 찾을 수 없음', { userIdPrefix, orderId });
  }

  return NextResponse.redirect(
    new URL(`/billing?success=1&provider=toss&plan=${plan}`, req.url)
  );
}
