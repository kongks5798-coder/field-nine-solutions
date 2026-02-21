import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

function adminClient() {
  const { createServerClient } = require('@supabase/ssr');
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

const PLAN_PRICES: Record<string, { original: number; discounted: number }> = {
  pro:  { original: 49000, discounted: 39000 },
  team: { original: 129000, discounted: 99000 },
};

// Stripe SDK의 타입 정의가 실제 API 응답과 다를 수 있어 캐스팅 헬퍼 사용
interface StripeSub {
  id: string;
  status: string;
  customer: string;
  metadata: Record<string, string>;
  items: { data: Array<{ price?: { id: string } }> };
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
  canceled_at: number | null;
}

function asSub(obj: unknown): StripeSub {
  return obj as unknown as StripeSub;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    console.error('[Webhook] 서명 검증 실패:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = adminClient();

  try {
    switch (event.type) {

      // ── 구독 생성 ─────────────────────────────────────────────────────────
      case 'customer.subscription.created': {
        const sub = asSub(event.data.object);
        const uid  = sub.metadata?.supabase_uid;
        const plan = sub.metadata?.plan || 'pro';
        if (!uid) break;

        const prices = PLAN_PRICES[plan] || { original: 0, discounted: 0 };

        await admin.from('subscriptions').upsert({
          user_id:                uid,
          plan,
          status:                 sub.status,
          stripe_customer_id:     sub.customer,
          stripe_subscription_id: sub.id,
          stripe_price_id:        sub.items.data[0]?.price?.id,
          original_price:         prices.original,
          discounted_price:       prices.discounted,
          current_period_start:   new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:     new Date(sub.current_period_end   * 1000).toISOString(),
          cancel_at_period_end:   sub.cancel_at_period_end,
          updated_at:             new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        // profiles.plan 업데이트
        await admin.from('profiles').upsert(
          { id: uid, plan, plan_updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );

        await admin.from('billing_events').insert({
          user_id:     uid,
          type:        'subscription_created',
          amount:      prices.discounted,
          description: `${plan} 플랜 구독 시작`,
          metadata:    { stripe_subscription_id: sub.id },
        });
        break;
      }

      // ── 결제 성공 ─────────────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as {
          subscription?: string;
          amount_paid?: number;
          description?: string;
          id: string;
        };
        const subId = invoice.subscription;
        if (!subId) break;

        const rawSub = await stripe.subscriptions.retrieve(subId);
        const sub = asSub(rawSub);
        const uid = sub.metadata?.supabase_uid;
        if (!uid) break;

        // 구독 갱신 시 기간 업데이트
        await admin.from('subscriptions')
          .update({
            status:               sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at:           new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subId);

        const amount = Math.round(invoice.amount_paid || 0);
        await admin.from('billing_events').insert({
          user_id:     uid,
          type:        'payment_succeeded',
          amount,
          description: invoice.description || '월 구독 결제',
          metadata:    { invoice_id: invoice.id, stripe_subscription_id: subId },
        });

        // 이번 달 초과 사용량 정산 후 미청구 기록 업데이트
        const period = new Date().toISOString().slice(0, 7);
        await admin.from('usage_records')
          .update({ billed: true })
          .eq('user_id', uid)
          .eq('billing_period', period)
          .eq('billed', false);

        // 결제 성공 이메일
        try {
          const { data: profile } = await admin.from('profiles').select('email:id, plan').eq('id', uid).single();
          const userEmail = (await admin.auth.admin.getUserById(uid)).data.user?.email;
          if (userEmail) {
            await sendPaymentSuccessEmail(userEmail, profile?.plan ?? 'pro', amount, period);
          }
        } catch { /* 이메일 실패해도 결제는 처리됨 */ }
        break;
      }

      // ── 결제 실패 ─────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as {
          subscription?: string;
          id: string;
        };
        const subId = invoice.subscription;
        if (!subId) break;

        const rawSub = await stripe.subscriptions.retrieve(subId);
        const sub = asSub(rawSub);
        const uid = sub.metadata?.supabase_uid;
        if (!uid) break;

        await admin.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);

        await admin.from('billing_events').insert({
          user_id:     uid,
          type:        'payment_failed',
          amount:      0,
          description: '결제 실패 — 카드를 확인해주세요',
          metadata:    { invoice_id: invoice.id },
        });

        // 결제 실패 이메일
        try {
          const userEmail = (await admin.auth.admin.getUserById(uid)).data.user?.email;
          if (userEmail) {
            const failPeriod = new Date().toISOString().slice(0, 7);
            await sendPaymentFailedEmail(userEmail, 0, failPeriod);
          }
        } catch { /* 이메일 실패해도 웹훅은 처리됨 */ }
        break;
      }

      // ── 구독 업데이트 ─────────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = asSub(event.data.object);
        const uid = sub.metadata?.supabase_uid;
        if (!uid) break;

        await admin.from('subscriptions')
          .update({
            status:               sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at:          sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            updated_at:           new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── 구독 취소 ─────────────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = asSub(event.data.object);
        const uid = sub.metadata?.supabase_uid;
        if (!uid) break;

        await admin.from('subscriptions')
          .update({
            status:      'canceled',
            canceled_at: new Date().toISOString(),
            updated_at:  new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        // profiles.plan → null (스타터로 강등)
        await admin.from('profiles').upsert(
          { id: uid, plan: null, plan_updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );

        await admin.from('billing_events').insert({
          user_id:     uid,
          type:        'subscription_canceled',
          amount:      0,
          description: '구독 취소 완료',
          metadata:    { stripe_subscription_id: sub.id },
        });
        break;
      }
    }
  } catch (err: unknown) {
    console.error('[Webhook] 처리 오류:', (err as Error).message);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
