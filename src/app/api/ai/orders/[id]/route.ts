import { NextRequest, NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { canTransition, getOrder, isOrderStatus, resolveOrderCommand, updateOrderStatus } from "@/core/orders";

export const runtime = "edge";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:one:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:patch:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let nextStatus: typeof order.status | null = null;
  if (body && typeof body.command === "string") {
    nextStatus = resolveOrderCommand(body.command, order.status);
  } else if (body && isOrderStatus(body.status)) {
    nextStatus = body.status;
  }
  if (!nextStatus) {
    return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  }
  if (!canTransition(order.status, nextStatus)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }
  const updated = await updateOrderStatus(id, nextStatus);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, order: updated });
}
