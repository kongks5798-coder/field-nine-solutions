import { NextResponse } from "next/server";
import { signJWT } from "@/core/jwt";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { z } from 'zod';

export const runtime = "edge";

const LoginSchema = z.object({
  password: z.string().min(1).max(200),
  otp:      z.string().max(20).optional().default(''),
});

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:login:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const loginParsed = LoginSchema.safeParse(await req.json().catch(() => ({})));
  if (!loginParsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { password, otp } = loginParsed.data;
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const twoFactor = process.env.ADMIN_2FA_CODE || "";
  if (!adminPassword) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  if (password !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (twoFactor && otp !== twoFactor) {
    return NextResponse.json({ error: "Two-factor required" }, { status: 401 });
  }
  const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const token = await signJWT({ sub: "admin" }, jwtSecret, 60 * 60 * 8);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
