import { NextResponse, NextRequest } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { slackNotify } from "@/core/integrations/slack";
import { zapierNotify } from "@/core/integrations/zapier";

export const runtime = "edge";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:patch:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const statuses = new Set(["pending", "paid", "cancelled", "refunded"]);
  const ok = typeof body === "object" && body && typeof body.status === "string" && statuses.has(body.status);
  if (!ok) return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  const db = getDB();
  const order = await db.getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const next = body.status as typeof order.status;
  const allowed =
    (order.status === "pending" && (next === "paid" || next === "cancelled")) ||
    (order.status === "paid" && (next === "refunded" || next === "paid")) ||
    (order.status === "cancelled" && next === "cancelled") ||
    (order.status === "refunded" && next === "refunded");
  if (!allowed) return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
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
