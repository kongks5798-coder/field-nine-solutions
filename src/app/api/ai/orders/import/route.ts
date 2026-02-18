import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { autoProcessOrders, importOrdersFromText } from "@/core/orders";

export const runtime = "edge";

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:import:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text : "";
  const autoProcess = body?.autoProcess !== false;
  const result = await importOrdersFromText(text);
  const processed = autoProcess ? await autoProcessOrders(result.created) : { processed: 0, updated: [] };
  return NextResponse.json({
    ok: true,
    created: result.created.length,
    rejected: result.rejected,
    processed: processed.processed,
  });
}
