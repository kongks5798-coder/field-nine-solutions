import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { measureSelfHeal } from "@/core/self-heal";

export const runtime = "edge";

export async function GET(req: Request) {
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
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:customers:post:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = await req.json().catch(() => null);
  const ok =
    typeof body === "object" &&
    body &&
    typeof body.name === "string" &&
    body.name.trim().length > 0 &&
    typeof body.email === "string" &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email);
  if (!ok) {
    return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  }
  const db = getDB();
  const customer = await db.createCustomer({ name: body.name.trim(), email: body.email.trim() });
  return NextResponse.json({ ok: true, customer });
}
