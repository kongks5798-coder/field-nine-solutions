import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { slackNotify } from "@/core/integrations/slack";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:test-slack:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const url = new URL(req.url);
  const event = url.searchParams.get("event") || "order_cancelled";
  const orderId = url.searchParams.get("orderId") || "TEST-ORDER";
  const amount = url.searchParams.get("amount") || "1000";
  const text =
    event === "order_cancelled"
      ? `테스트 알림: 주문 취소 발생 | 주문:${orderId} | 금액:${amount}`
      : `테스트 알림: ${event} | 주문:${orderId} | 금액:${amount}`;
  await slackNotify(text);
  return NextResponse.json({ ok: true, sent: true, text });
}
