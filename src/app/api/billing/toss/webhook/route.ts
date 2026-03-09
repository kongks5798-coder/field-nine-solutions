import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { log } from '@/lib/logger';

/**
 * Verify TossPayments webhook signature using HMAC-SHA256.
 * Uses the Web Crypto API so it works in Edge runtimes as well.
 *
 * Toss signs the raw JSON body with HMAC-SHA256 and sends the
 * base64-encoded result in the `TossPayments-Webhook-Signature` header.
 */
async function verifyTossWebhookSignature(
  body: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

    // Constant-time comparison to prevent timing attacks
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Read the raw body text BEFORE parsing JSON so we can verify the signature
  // against the exact bytes Toss signed.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  // ── HMAC signature verification ──────────────────────────────────────────
  const sig    = req.headers.get('TossPayments-Webhook-Signature');
  const secret = process.env.TOSSPAYMENTS_WEBHOOK_SECRET ?? '';

  // If the secret is configured, the signature MUST match.
  // When secret is absent (local/dev), verification is skipped for
  // backwards-compatibility.
  if (secret && !(await verifyTossWebhookSignature(rawBody, sig, secret))) {
    console.error('[toss-webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── Parse JSON ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { eventType, eventId, data } = body as {
    eventType?: string;
    eventId?:   string;
    data?:      Record<string, unknown>;
  };

  if (!eventType || !data) {
    return NextResponse.json({ error: 'eventType 또는 data 누락' }, { status: 400 });
  }

  log.info('[Toss webhook] 이벤트 수신', { eventType, eventId });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  // ── Idempotency check ─────────────────────────────────────────────────────
  // If the webhook includes an eventId, skip processing when we have already
  // handled it (Toss may retry on network errors).
  if (eventId) {
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      log.info('[Toss webhook] 중복 이벤트 — 스킵', { eventId });
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // Record the event so future retries are skipped.
    // Non-fatal — a unique constraint violation means a concurrent request
    // already inserted it; other errors are logged but we continue.
    try {
      const { error: insertErr } = await supabase
        .from('webhook_events')
        .insert({ event_id: eventId, event_type: eventType, received_at: new Date().toISOString() });
      if (insertErr) {
        log.error('[Toss webhook] webhook_events 저장 실패', { err: insertErr, eventId });
      }
    } catch (err) {
      log.error('[Toss webhook] webhook_events 저장 예외', { err, eventId });
    }
  }

  // ── Event handling ────────────────────────────────────────────────────────

  // 결제 완료 이벤트
  if (eventType === 'PAYMENT_STATUS_CHANGED' && data.status === 'DONE') {
    log.billing('toss.webhook.payment_done', { orderId: data.orderId });
  }

  // 자동결제(빌링키) 발급 이벤트
  if (eventType === 'BILLING_KEY_ISSUED') {
    const { billingKey, customerKey } = data as {
      billingKey?:  string;
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
      const parts        = orderId.split('_');
      const userIdPrefix = parts[1] ?? '';
      const amountNum    = Number(data.amount ?? 0);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${userIdPrefix}%`)
        .single();

      if (profile) {
        await supabase.from('usage_records').insert({
          user_id:        profile.id,
          type:           'subscription',
          amount:         amountNum,
          billing_period: new Date().toISOString().slice(0, 7),
          billed:         true,
        });
        log.billing('toss.webhook.renewal', { userId: profile.id, amount: amountNum });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
