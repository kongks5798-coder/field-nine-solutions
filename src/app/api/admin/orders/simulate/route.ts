import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { simulateOrderFlow } from "@/core/orders";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const SimulateSchema = z.object({
  count: z.number().int().min(1).max(50).optional().default(10),
});

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:orders:simulate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { count } = SimulateSchema.parse(await req.json().catch(() => ({})));
  const result = simulateOrderFlow(count);
  return NextResponse.json({ ok: true, result });
}
