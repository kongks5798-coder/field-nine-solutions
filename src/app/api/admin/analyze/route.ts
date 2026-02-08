import { NextResponse } from "next/server";
import { analyzeBusiness } from "@/core/jarvis";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";

export const runtime = "edge";

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:analyze:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  type P = { t: string; v: number };
  const isValidArray = (arr: unknown) =>
    Array.isArray(arr) &&
    arr.every(
      (x: unknown) => {
        const y = x as Partial<P>;
        return (
          typeof y === "object" &&
          y !== null &&
          typeof y.t === "string" &&
          typeof y.v === "number" &&
          Number.isFinite(y.v)
        );
      }
    );
  const ok =
    typeof payload === "object" &&
    payload &&
    isValidArray(payload.sales) &&
    isValidArray(payload.trends) &&
    payload.sales.length > 0 &&
    payload.trends.length > 0 &&
    payload.sales.length <= 1000 &&
    payload.trends.length <= 1000;
  if (!ok) {
    return NextResponse.json({ error: "Schema validation failed" }, { status: 400 });
  }
  const result = await analyzeBusiness(payload);
  return NextResponse.json({ ok: true, result });
}
