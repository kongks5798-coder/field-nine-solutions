import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { autoProcessOrders, generateOrdersFromMarket } from "@/core/orders";
import { z } from 'zod';

export const runtime = "edge";

const GenerateSchema = z.object({
  count:       z.number().int().min(1).max(50).optional().default(10),
  avgAmount:   z.number().min(20).optional().default(180),
  autoProcess: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:generate:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { count, avgAmount, autoProcess } = GenerateSchema.parse(await req.json().catch(() => ({})));
  const created = generateOrdersFromMarket(count, avgAmount);
  const processed = autoProcess ? await autoProcessOrders(created) : { processed: 0, updated: [] };
  return NextResponse.json({ ok: true, created: created.length, processed: processed.processed });
}
