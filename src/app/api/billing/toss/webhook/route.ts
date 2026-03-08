import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { eventType, data } = body as {
    eventType?: string;
    data?: Record<string, unknown>;
  };

  if (!eventType || !data) {
    return NextResponse.json({ error: 'eventType 또는 data 누락' }, { status: 400 });
  }

  log.info('[Toss webhook] 이벤트 수신', { eventType });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 결제 완료 이벤트
  if (eventType === 'PAYMENT_STATUS_CHANGED' && data.status === 'DONE') {
    log.billing('toss.webhook.payment_done', { orderId: data.orderId });
  }

  // 자동결제(빌링키) 발급 이벤트
  if (eventType === 'BILLING_KEY_ISSUED') {
    const { billingKey, customerKey } = data as {
      billingKey?: string;
      customerKey?: string;
    };
    if (billingKey && customerKey) {
      const { error } = await supabase
        .from('profiles')
        .update({ toss_billing_key: billingKey })
        .eq('id', customerKey);

      if (error) {
        log.error('[Toss webhook] 빌링키 저장 실패', { error, customerKey });
      } else {
        log.billing('toss.webhook.billing_key_saved', { customerKey });
      }
    }
  }

  // 정기결제 성공 이벤트 — 구독 갱신 처리
  if (eventType === 'BILLING_STATUS_CHANGED' && data.status === 'DONE') {
    const orderId = data.orderId as string | undefined;
    if (orderId) {
      const parts = orderId.split('_');
      const userIdPrefix = parts[1] ?? '';
      const amountNum = Number(data.amount ?? 0);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${userIdPrefix}%`)
        .single();

      if (profile) {
        await supabase.from('usage_records').insert({
          user_id: profile.id,
          type: 'subscription',
          amount: amountNum,
          billing_period: new Date().toISOString().slice(0, 7),
          billed: true,
        });
        log.billing('toss.webhook.renewal', { userId: profile.id, amount: amountNum });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
