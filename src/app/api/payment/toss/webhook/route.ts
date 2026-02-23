/**
 * TossPayments Webhook Handler
 *
 * TossPayments에서 결제 상태 변경 등의 이벤트를 수신합니다.
 * HMAC-SHA256 서명 검증으로 요청의 무결성과 진위를 확인합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { log } from "@/lib/logger";
import { getAdminClient } from "@/lib/supabase-admin";

const TOSS_WEBHOOK_SECRET = process.env.TOSSPAYMENTS_WEBHOOK_SECRET ?? "";

/**
 * TossPayments 웹훅 서명을 HMAC-SHA256으로 검증합니다.
 * timing-safe comparison을 사용하여 타이밍 공격을 방지합니다.
 */
function verifyTossSignature(
  body: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  // 길이가 다르면 timingSafeEqual이 throw하므로 먼저 확인
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

export async function POST(req: NextRequest) {
  // ── 웹훅 시크릿 미설정 체크 ────────────────────────────────────────────
  if (!TOSS_WEBHOOK_SECRET) {
    log.error("toss.webhook.missing_secret", {
      msg: "TOSSPAYMENTS_WEBHOOK_SECRET 미설정",
    });
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 401 },
    );
  }

  // ── HMAC-SHA256 서명 검증 ──────────────────────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get("toss-signature");

  if (!verifyTossSignature(rawBody, signature, TOSS_WEBHOOK_SECRET)) {
    log.security("toss.webhook.invalid_signature", {
      hasSignature: !!signature,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const { eventType, data } = body;

    // ── 타임스탬프 검증 (±5분 허용) ────────────────────────────────────────
    const TOLERANCE_MS = 5 * 60 * 1000;
    const eventTimestamp = body.createdAt ?? data?.createdAt ?? data?.approvedAt;
    if (eventTimestamp) {
      const eventTime = new Date(eventTimestamp).getTime();
      const now = Date.now();
      if (Number.isNaN(eventTime) || Math.abs(now - eventTime) > TOLERANCE_MS) {
        log.security("toss.webhook.timestamp_out_of_range", {
          eventTimestamp,
          drift: Number.isNaN(eventTime) ? "invalid" : Math.abs(now - eventTime),
        });
        return NextResponse.json(
          { error: "Timestamp out of range" },
          { status: 400 },
        );
      }
    }

    log.billing(`toss.webhook.${eventType}`, {
      orderId: data?.orderId,
      paymentKey: data?.paymentKey,
    });

    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, orderId, status } = data;
        // orderId follows "userId_timestamp" or "userId-..." convention
        const userId = orderId.split(/[_-]/)[0];
        const admin = getAdminClient();

        if (status === "DONE") {
          log.billing("toss.webhook.payment_confirmed", {
            orderId,
            paymentKey,
          });
          // Activate subscription: upsert into subscriptions table
          await admin.from("subscriptions").upsert(
            {
              user_id: userId,
              plan: "pro",
              status: "active",
              toss_payment_key: paymentKey,
              toss_order_id: orderId,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
            { onConflict: "user_id" },
          );
        } else if (status === "CANCELED" || status === "PARTIAL_CANCELED") {
          log.billing("toss.webhook.payment_canceled", {
            orderId,
            paymentKey,
            status,
          });
          // Cancel subscription by payment key
          await admin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("toss_payment_key", paymentKey);
        } else if (status === "EXPIRED") {
          log.billing("toss.webhook.payment_expired", {
            orderId,
            paymentKey,
          });
          // Mark expired payment's subscription as canceled
          await admin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("toss_payment_key", paymentKey);
        }
        break;
      }

      case "PAYOUT_STATUS_CHANGED": {
        log.billing("toss.webhook.payout_status_changed", { data });
        break;
      }

      default:
        log.warn(`toss.webhook.unknown_event: ${eventType}`, { data });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    log.error("toss.webhook.error", { error: (err as Error).message });
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
