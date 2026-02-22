import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { createOrder, listOrders, isOrderStatus } from "@/core/orders";
import { z } from 'zod';

export const runtime = "edge";

const AiOrderCreateSchema = z.object({
  customerId: z.string().min(1).max(100).transform(s => s.trim()),
  amount:     z.number().positive().finite(),
  status:     z.string().refine(isOrderStatus).optional(),
});

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
  const orderParsed = AiOrderCreateSchema.safeParse(await req.json().catch(() => null));
  if (!orderParsed.success) {
    return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  }
  const { customerId, amount, status } = orderParsed.data;
  const order = await createOrder({ customerId, amount, status });
  return NextResponse.json({ ok: true, order });
}
