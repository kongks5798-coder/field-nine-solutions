import { NextRequest, NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { canTransition, getOrder, isOrderStatus, resolveOrderCommand, updateOrderStatus } from "@/core/orders";
import { z } from 'zod';

export const runtime = "edge";

const AiOrderActionSchema = z.object({
  command: z.string().min(1).max(50).optional(),
  status:  z.string().refine(isOrderStatus).optional(),
}).refine(d => d.command !== undefined || d.status !== undefined, { message: 'command 또는 status 필요' });

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:one:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { id } = await ctx.params;
  const order = getOrder(id);
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
  const actionParsed = AiOrderActionSchema.safeParse(await req.json().catch(() => null));
  if (!actionParsed.success) {
    return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  }
  const order = getOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { command, status: bodyStatus } = actionParsed.data;
  const nextStatus: string = command
    ? resolveOrderCommand(command, order.status)
    : bodyStatus!;
  if (!canTransition(order.status, nextStatus)) {
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  }
  const updated = await updateOrderStatus(id, nextStatus);
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, order: updated });
}
