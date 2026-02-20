import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { simulateOrderFlow } from "@/core/orders";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:simulate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => ({}));
  const count = typeof body?.count === "number" && Number.isFinite(body.count) ? Math.max(1, Math.min(50, body.count)) : 10;
  const result = await simulateOrderFlow(count);
  return NextResponse.json({ ok: true, result });
}
