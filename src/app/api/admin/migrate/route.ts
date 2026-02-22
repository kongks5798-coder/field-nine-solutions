import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { isOrderStatus } from "@/core/orders";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const CustomerMigrateSchema = z.object({
  id:        z.string().optional(),
  name:      z.string().min(1).max(100).transform(s => s.trim()),
  email:     z.string().email().max(254).transform(s => s.trim()),
  createdAt: z.number().optional(),
});

const OrderMigrateSchema = z.object({
  id:         z.string().optional(),
  customerId: z.string().min(1).max(100).transform(s => s.trim()),
  amount:     z.number().positive().finite(),
  status:     z.string().refine(isOrderStatus).optional(),
  createdAt:  z.number().optional(),
});

const MigrateSchema = z.object({
  customers: z.array(CustomerMigrateSchema).max(10000).optional(),
  orders:    z.array(OrderMigrateSchema).max(10000).optional(),
}).refine(d => d.customers !== undefined || d.orders !== undefined, {
  message: 'customers 또는 orders 배열 중 하나 이상 필요',
});

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:migrate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const parsed = MigrateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }
  const { customers, orders } = parsed.data;
  const db = getDB();
  const inserted = { customers: 0, orders: 0 };
  if (customers) {
    for (const c of customers) {
      await db.createCustomer({ name: c.name, email: c.email });
      inserted.customers += 1;
    }
  }
  if (orders) {
    for (const o of orders) {
      await db.createOrder({ customerId: o.customerId, amount: o.amount, status: o.status });
      inserted.orders += 1;
    }
  }
  return NextResponse.json({ ok: true, inserted });
}
