import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendPaymentSuccessEmail, sendPaymentFailedEmail } from '@/lib/email';
import { validateEnv } from '@/lib/env';
import { log } from '@/lib/logger';
import { getAdminClient } from '@/lib/supabase-admin';
import { PLAN_PRICES } from '@/lib/plans';
validateEnv();

if (!process.env.STRIPE_SECRET_KEY) {
  log.warn('[Webhook] STRIPE_SECRET_KEY 미설정 — Stripe 웹훅 비활성화');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_disabled');
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';


// Stripe v20+ TS 타입에서 제거된 런타임 필드(current_period_*)를 재선언
interface StripeSub {
  id: string;
  status: Stripe.Subscription['status'];
  customer: string;
  metadata: Record<string, string>;
  items: Stripe.Subscription['items'];
  cancel_at_period_end: boolean;
  current_period_start: number; // API 응답에는 존재하지만 v20 TS 타입에서 제거됨
  current_period_end: number;   // API 응답에는 존재하지만 v20 TS 타입에서 제거됨
  canceled_at: number | null;
}

function asSub(obj: object): StripeSub {
  return obj as StripeSub;
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    log.security('stripe.webhook.invalid_signature', { msg: (err as Error).message });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = getAdminClient();

  try {
    switch (event.type) {

      // ── 구독 생성 ─────────────────────────────────────────────────────────
      case 'customer.subscription.created': {
        const sub = asSub(event.data.object);
        const uid  = sub.metadata?.supabase_uid;
        const plan = sub.metadata?.plan || 'pro';
        if (!uid) {
          log.warn('stripe.webhook.missing_uid', { event: event.type, subId: sub.id });
          break;
        }

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
          { id: uid, plan, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );

        await admin.from('billing_events').insert({
          user_id:     uid,
          type:        'subscription_created',
          amount:      prices.discounted,
          description: `${plan} 플랜 구독 시작`,
          metadata:    { stripe_subscription_id: sub.id },
        });
        log.billing('subscription.created', { uid, plan, subId: sub.id });
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

        log.billing('payment.succeeded', { uid, amount, period, subId });
        // 결제 성공 이메일
        try {
          const { data: profile } = await admin.from('profiles').select('plan').eq('id', uid).single();
          const userEmail = (await admin.auth.admin.getUserById(uid)).data.user?.email;
          if (userEmail) {
            await sendPaymentSuccessEmail(userEmail, profile?.plan ?? 'pro', amount, period);
          }
        } catch (emailErr: unknown) {
          log.warn('email.payment_success.failed', { uid, msg: (emailErr as Error).message });
        }
        break;
      }

      // ── 결제 실패 ─────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as {
          subscription?: string;
          amount_due?: number;
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

        log.billing('payment.failed', { uid, subId });
        // 결제 실패 이메일
        try {
          const userEmail = (await admin.auth.admin.getUserById(uid)).data.user?.email;
          if (userEmail) {
            const failPeriod = new Date().toISOString().slice(0, 7);
            await sendPaymentFailedEmail(userEmail, Math.round(invoice.amount_due || 0), failPeriod);
          }
        } catch (emailErr: unknown) {
          log.warn('email.payment_failed.failed', { uid, msg: (emailErr as Error).message });
        }
        break;
      }

      // ── 구독 업데이트 ─────────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = asSub(event.data.object);
        const uid = sub.metadata?.supabase_uid;
        if (!uid) {
          log.warn('stripe.webhook.missing_uid', { event: event.type, subId: sub.id });
          break;
        }

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
          { id: uid, plan: null, updated_at: new Date().toISOString() },
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
    log.error('stripe.webhook.processing_error', { msg: (err as Error).message });
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
