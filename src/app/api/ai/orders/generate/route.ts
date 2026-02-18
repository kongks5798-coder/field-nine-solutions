import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { autoProcessOrders, generateOrdersFromMarket } from "@/core/orders";

export const runtime = "edge";

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:generate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => ({}));
  const count = typeof body?.count === "number" && Number.isFinite(body.count) ? Math.max(1, Math.min(50, body.count)) : 10;
  const avgAmount =
    typeof body?.avgAmount === "number" && Number.isFinite(body.avgAmount) ? Math.max(20, body.avgAmount) : 180;
  const autoProcess = body?.autoProcess !== false;
  const created = await generateOrdersFromMarket(count, avgAmount);
  const processed = autoProcess ? await autoProcessOrders(created) : { processed: 0, updated: [] };
  return NextResponse.json({ ok: true, created: created.length, processed: processed.processed });
}
