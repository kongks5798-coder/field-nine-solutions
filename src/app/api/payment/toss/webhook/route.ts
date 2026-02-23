/**
 * TossPayments Webhook Handler
 *
 * TossPayments에서 결제 상태 변경 등의 이벤트를 수신합니다.
 *
 * ⚠️ 프로덕션 주의사항:
 *   - TossPayments 웹훅 시크릿을 사용한 서명 검증을 반드시 추가해야 합니다.
 *     (TOSSPAYMENTS_WEBHOOK_SECRET 환경변수 + HMAC-SHA256 검증)
 *   - 현재는 로깅만 수행하며, DB 업데이트 로직은 TODO로 남겨져 있습니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // TODO: 프로덕션에서는 TossPayments 웹훅 시크릿을 사용한 서명 검증 필수
    // const signature = req.headers.get("toss-signature");
    // if (!verifyWebhookSignature(body, signature)) { ... }

    const body = await req.json();
    const { eventType, data } = body;

    log.billing(`toss.webhook.${eventType}`, {
      orderId: data?.orderId,
      paymentKey: data?.paymentKey,
    });

    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED": {
        const { paymentKey, orderId, status } = data;

        if (status === "DONE") {
          log.billing("toss.webhook.payment_confirmed", { orderId, paymentKey });
          // TODO: Supabase 설정 후 구독/주문 상태 DB 업데이트
        } else if (status === "CANCELED" || status === "PARTIAL_CANCELED") {
          log.billing("toss.webhook.payment_canceled", {
            orderId,
            paymentKey,
            status,
          });
          // TODO: 취소 처리 — 필요 시 구독 복원/강등
        } else if (status === "EXPIRED") {
          log.billing("toss.webhook.payment_expired", { orderId, paymentKey });
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
