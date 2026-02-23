/**
 * TossPayments Webhook Handler
 *
 * TossPayments에서 결제 상태 변경 등의 이벤트를 수신합니다.
 * HMAC-SHA256 서명 검증으로 요청의 무결성과 진위를 확인합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { log } from "@/lib/logger";

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

    log.billing(`toss.webhook.${eventType}`, {
      orderId: data?.orderId,
      paymentKey: data?.paymentKey,
    });

    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, orderId, status } = data;

        if (status === "DONE") {
          log.billing("toss.webhook.payment_confirmed", {
            orderId,
            paymentKey,
          });
          // TODO: Supabase 설정 후 구독/주문 상태 DB 업데이트
        } else if (status === "CANCELED" || status === "PARTIAL_CANCELED") {
          log.billing("toss.webhook.payment_canceled", {
            orderId,
            paymentKey,
            status,
          });
          // TODO: 취소 처리 — 필요 시 구독 복원/강등
        } else if (status === "EXPIRED") {
          log.billing("toss.webhook.payment_expired", {
            orderId,
            paymentKey,
          });
          // TODO: 만료된 결제 처리
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
