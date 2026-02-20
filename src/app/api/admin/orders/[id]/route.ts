import { NextResponse, NextRequest } from "next/server";
import { getDB } from "@/core/database";
import { canTransition, isOrderStatus } from "@/core/orders";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { slackNotify } from "@/core/integrations/slack";
import { zapierNotify } from "@/core/integrations/zapier";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const db = getDB();
  const order = await db.getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:patch:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const ok = typeof body === "object" && body && isOrderStatus(body.status);
  if (!ok) return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  const db = getDB();
  const order = await db.getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const next = body.status as typeof order.status;
  if (!canTransition(order.status, next)) return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  const updated = await db.updateOrderStatus(id, next);
  if (!updated) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  if (next === "cancelled") {
    await slackNotify(`주문 취소: #${updated.id} | 고객:${updated.customerId} | 금액:${updated.amount}`);
    await zapierNotify("order_cancelled", { order: updated });
  } else if (next === "refunded") {
    await slackNotify(`주문 환불: #${updated.id} | 고객:${updated.customerId} | 금액:${updated.amount}`);
    await zapierNotify("order_refunded", { order: updated });
  }
  return NextResponse.json({ ok: true, order: updated });
}
