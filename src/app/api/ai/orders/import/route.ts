import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { autoProcessOrders, importOrdersFromText } from "@/core/orders";
import { z } from 'zod';

export const runtime = "edge";

const ImportSchema = z.object({
  text:        z.string().max(50_000).optional().default(''),
  autoProcess: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:ai:orders:import:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const { text, autoProcess } = ImportSchema.parse(await req.json().catch(() => ({})));
  const result = await importOrdersFromText(text);
  const processed = autoProcess ? await autoProcessOrders(result.created) : { processed: 0, updated: [] };
  return NextResponse.json({
    ok: true,
    created: result.created.length,
    rejected: result.rejected,
    processed: processed.processed,
  });
}
