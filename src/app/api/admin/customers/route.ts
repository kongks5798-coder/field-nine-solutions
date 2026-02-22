import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { measureSelfHeal } from "@/core/self-heal";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const CustomerPostSchema = z.object({
  name:  z.string().min(1).max(100).transform(s => s.trim()),
  email: z.string().email().max(254),
});

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:customers:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const db = getDB();
  const { result, cache } = await measureSelfHeal("api:customers:list", "GET", async () => db.listCustomers());
  const res = NextResponse.json({ ok: true, customers: result });
  res.headers.set("Cache-Control", cache);
  return res;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:customers:post:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const custParsed = CustomerPostSchema.safeParse(await req.json().catch(() => null));
  if (!custParsed.success) {
    return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  }
  const { name, email } = custParsed.data;
  const db = getDB();
  const customer = await db.createCustomer({ name, email });
  return NextResponse.json({ ok: true, customer });
}
