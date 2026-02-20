import { NextResponse, NextRequest } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:customers:delete:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const db = getDB();
  const ok = await db.deleteCustomer(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:customers:patch:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const ok =
    typeof body === "object" &&
    body &&
    ((typeof body.name === "string" && body.name.trim().length > 0) ||
      (typeof body.email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)));
  if (!ok) return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  const db = getDB();
  const updated = await db.updateCustomer(id, { name: body.name, email: body.email });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer: updated });
}
