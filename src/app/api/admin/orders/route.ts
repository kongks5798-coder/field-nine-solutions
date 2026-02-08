import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { zapierNotify } from "@/core/integrations/zapier";
import { measureSelfHeal } from "@/core/self-heal";

export const runtime = "edge";

export async function GET(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const db = getDB();
  const { result, cache } = await measureSelfHeal("api:orders:list", "GET", async () => db.listOrders());
  const res = NextResponse.json({ ok: true, orders: result });
  res.headers.set("Cache-Control", cache);
  return res;
}

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:post:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => null);
  const statuses = new Set(["pending", "paid", "cancelled", "refunded"]);
  const ok =
    typeof body === "object" &&
    body &&
    typeof body.customerId === "string" &&
    body.customerId.trim().length > 0 &&
    typeof body.amount === "number" &&
    Number.isFinite(body.amount) &&
    body.amount > 0 &&
    (body.status === undefined || (typeof body.status === "string" && statuses.has(body.status)));
  if (!ok) {
    return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  }
  const db = getDB();
  const order = await db.createOrder({
    customerId: body.customerId.trim(),
    amount: body.amount,
    status: body.status,
  });
  if (order.status === "paid") {
    await zapierNotify("payment", { order });
  }
  return NextResponse.json({ ok: true, order });
}
