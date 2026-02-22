import { NextResponse, NextRequest } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const CustomerPatchSchema = z.object({
  name:  z.string().min(1).max(100).optional(),
  email: z.string().email().max(254).optional(),
}).refine(d => d.name !== undefined || d.email !== undefined, { message: 'name 또는 email 중 하나는 필수' });

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
  const patchParsed = CustomerPatchSchema.safeParse(await req.json().catch(() => null));
  if (!patchParsed.success) return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  const db = getDB();
  const updated = await db.updateCustomer(id, patchParsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer: updated });
}
