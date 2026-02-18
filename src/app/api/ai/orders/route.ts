import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { createOrder, listOrders, isOrderStatus } from "@/core/orders";

export const runtime = "edge";

export async function GET(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const orders = await listOrders();
  return NextResponse.json({ ok: true, orders });
}

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:post:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => null);
  const ok =
    typeof body === "object" &&
    body &&
    typeof body.customerId === "string" &&
    body.customerId.trim().length > 0 &&
    typeof body.amount === "number" &&
    Number.isFinite(body.amount) &&
    body.amount > 0 &&
    (body.status === undefined || isOrderStatus(body.status));
  if (!ok) {
    return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  }
  const order = await createOrder({
    customerId: body.customerId.trim(),
    amount: body.amount,
    status: body.status,
  });
  return NextResponse.json({ ok: true, order });
}
