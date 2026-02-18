import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { isOrderStatus } from "@/core/orders";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";

export const runtime = "edge";

type CustomerPayload = { id?: string; name: string; email: string; createdAt?: number };
type OrderPayload = {
  id?: string;
  customerId: string;
  amount: number;
  status?: string;
  createdAt?: number;
};

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:migrate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => null);
  const isCustomers = Array.isArray(body?.customers);
  const isOrders = Array.isArray(body?.orders);
  if (!isCustomers && !isOrders) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const db = getDB();
  const inserted = { customers: 0, orders: 0 };
  if (isCustomers) {
    for (const c of body.customers as CustomerPayload[]) {
      if (
        typeof c?.name === "string" &&
        c.name.trim().length > 0 &&
        typeof c?.email === "string" &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)
      ) {
        await db.createCustomer({ name: c.name.trim(), email: c.email.trim() });
        inserted.customers += 1;
      }
    }
  }
  if (isOrders) {
    for (const o of body.orders as OrderPayload[]) {
      if (
        typeof o?.customerId === "string" &&
        o.customerId.trim().length > 0 &&
        typeof o?.amount === "number" &&
        Number.isFinite(o.amount) &&
        o.amount > 0 &&
        (o.status === undefined || isOrderStatus(o.status))
      ) {
        await db.createOrder({
          customerId: o.customerId.trim(),
          amount: o.amount,
          status: o.status,
        });
        inserted.orders += 1;
      }
    }
  }
  return NextResponse.json({ ok: true, inserted });
}
