import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { runProactive } from "@/core/proactive";
import { slackNotify } from "@/core/integrations/slack";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:proactive:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const report = await runProactive();
  const top = report.signals.slice(0, 3);
  const text =
    `Proactive 리포트\n` +
    top.map((s) => `- ${s.message}`).join("\n") +
    `\n예측 매출: $${report.forecast.nextRevenue.toLocaleString()} (신뢰도 ${(report.forecast.confidence * 100).toFixed(0)}%)` +
    `\n스냅샷: 고객 ${report.snapshot.customers}, 주문 ${report.snapshot.orders}, 매출 $${report.snapshot.revenue.toLocaleString()}`;
  await slackNotify(text);
  return NextResponse.json({ ok: true, report });
}
