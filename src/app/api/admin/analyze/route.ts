import { NextResponse } from "next/server";
import { analyzeBusiness } from "@/core/jarvis";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { requireAdmin } from "@/core/adminAuth";
import { z } from 'zod';

export const runtime = "edge";

const DataPointSchema = z.object({ t: z.string().max(50), v: z.number().finite() });
const AnalyzeSchema = z.object({
  sales:  z.array(DataPointSchema).min(1).max(1000),
  trends: z.array(DataPointSchema).min(1).max(1000),
});

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:analyze:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const analyzeParsed = AnalyzeSchema.safeParse(await req.json().catch(() => null));
  if (!analyzeParsed.success) {
    return NextResponse.json({ error: 'Schema validation failed' }, { status: 400 });
  }
  const result = await analyzeBusiness(analyzeParsed.data);
  return NextResponse.json({ ok: true, result });
}
