import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { isOrderStatus } from "@/core/orders";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { zapierNotify } from "@/core/integrations/zapier";
import { measureSelfHeal } from "@/core/self-heal";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const OrderCreateSchema = z.object({
  customerId: z.string().min(1).max(100).transform(s => s.trim()),
  amount:     z.number().positive().finite(),
  status:     z.string().refine(isOrderStatus).optional(),
});

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
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
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:post:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const orderParsed = OrderCreateSchema.safeParse(await req.json().catch(() => null));
  if (!orderParsed.success) {
    return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  }
  const { customerId, amount, status } = orderParsed.data;
  const db = getDB();
  const order = await db.createOrder({ customerId, amount, status });
  if (order.status === "paid") {
    await zapierNotify("payment", { order });
  }
  return NextResponse.json({ ok: true, order });
}
