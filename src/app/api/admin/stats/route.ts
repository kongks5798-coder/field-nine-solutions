import { NextResponse } from "next/server";
import { getDB } from "@/core/database";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { measureSelfHeal } from "@/core/self-heal";

export const runtime = "edge";

export async function GET(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:stats:get:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const db = getDB();
  const { result, cache } = await measureSelfHeal("api:stats:get", "GET", async () => db.stats());
  const res = NextResponse.json({ ok: true, stats: result });
  res.headers.set("Cache-Control", cache);
  return res;
}
