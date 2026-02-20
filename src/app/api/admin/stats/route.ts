import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:stats:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const db = getDB();
  const [rawStats, customers] = await Promise.all([db.stats(), db.listCustomers()]);
  const stats = rawStats
    ? { customers: customers.length, orders: rawStats.totalOrders ?? 0, revenue: rawStats.totalAmount ?? 0 }
    : null;
  const res = NextResponse.json({ ok: true, stats });
  res.headers.set("Cache-Control", "no-cache");
  return res;
}
