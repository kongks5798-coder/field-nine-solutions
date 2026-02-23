/**
 * POST /api/billing/invoice
 * 월말 자동 청구 처리 — Vercel Cron으로 매월 1일 00:00 KST 실행
 * CRON_SECRET 헤더로 인증
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function runInvoiceCron(req: NextRequest) {
  // Cron 인증 (Vercel Cron 또는 직접 호출 시 Authorization 헤더 확인)
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = adminClient();

  // 지난달 billing_period 계산 (YYYY-MM)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = lastMonth.toISOString().slice(0, 7);

  // 청구 대상: 지난달 open 상태의 usage (금액 > 0)
  const { data: invoices, error } = await admin
    .from('monthly_usage')
    .select('id, user_id, amount_krw, ai_calls')
    .eq('billing_period', period)
    .eq('status', 'open')
    .gt('amount_krw', 0);

  if (error) {
    log.error('[Invoice Cron] DB 조회 실패', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const inv of (invoices || [])) {
    try {
      // 사용자의 Stripe customer_id 조회
      const { data: profile } = await admin
        .from('profiles')
        .select('stripe_customer_id, plan')
        .eq('id', inv.user_id)
        .single();

      // 스타터 플랜이거나 금액 없으면 스킵
      if (!profile?.stripe_customer_id || !profile?.plan || profile.plan === 'starter') {
        await admin.from('monthly_usage').update({ status: 'skipped' }).eq('id', inv.id);
        results.skipped++;
        continue;
      }

      // Stripe Invoice 생성 (후불 청구)
      const invoice = await stripe.invoices.create({
        customer:           profile.stripe_customer_id,
        auto_advance:       true,   // 자동 finalizeÅ 결제 시도
        collection_method:  'charge_automatically',
        description:        `Dalkak ${period} 사용료 (AI ${inv.ai_calls}회)`,
        metadata: {
          user_id:        inv.user_id,
          billing_period: period,
          ai_calls:       String(inv.ai_calls),
        },
      });

      // Invoice Item 추가
      await stripe.invoiceItems.create({
        customer:    profile.stripe_customer_id,
        invoice:     invoice.id,
        amount:      inv.amount_krw,  // KRW (원 단위)
        currency:    'krw',
        description: `AI 사용료 ${inv.ai_calls}회 × 단가 (${period})`,
      });

      // Invoice 확정 및 결제 시도
      await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.pay(invoice.id);

      // monthly_usage 상태 업데이트
      await admin.from('monthly_usage')
        .update({ status: 'invoiced', stripe_invoice_id: invoice.id, updated_at: new Date().toISOString() })
        .eq('id', inv.id);

      // billing_events 기록
      await admin.from('billing_events').insert({
        user_id:     inv.user_id,
        type:        'usage_invoiced',
        amount:      inv.amount_krw,
        description: `${period} 사용료 자동 청구 — AI ${inv.ai_calls}회`,
        metadata:    { stripe_invoice_id: invoice.id, period },
      });

      results.success++;
    } catch (err: unknown) {
      log.error('[Invoice Cron] 청구 실패', { userId: inv.user_id, error: (err as Error).message });

      // 결제 실패 시 past_due 처리
      await admin.from('monthly_usage')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', inv.id);

      // billing_events 실패 기록
      await admin.from('billing_events').insert({
        user_id:     inv.user_id,
        type:        'usage_invoice_failed',
        amount:      inv.amount_krw,
        description: `${period} 사용료 청구 실패 — ${(err as Error).message}`,
        metadata:    { period },
      });

      results.failed++;
    }
  }

  log.info('[Invoice Cron] 완료', { period, ...results });
  const res = NextResponse.json({ period, ...results });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

// Vercel Cron uses GET — POST kept for manual/webhook calls
export async function GET(req: NextRequest) { return runInvoiceCron(req); }
export async function POST(req: NextRequest) { return runInvoiceCron(req); }
