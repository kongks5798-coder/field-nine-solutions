import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./src/core/jwt";
import { ipFromHeaders, checkLimit, headersFor } from "./src/core/rateLimit";

const PUBLIC_PATHS = [
  "/",
  "/admin/login",
  "/_next",
  "/favicon.ico",
  "/api/auth/login",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    const ip = ipFromHeaders(req.headers);
    const res = checkLimit(`api:${ip}`);
    if (!res.ok) {
      const json = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      Object.entries(headersFor(res)).forEach(([k, v]) => json.headers.set(k, v));
      return json;
    }
  }
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = req.cookies.get("auth")?.value || "";
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || "";
    if (!token || !secret) {
      const url = new URL("/admin/login", req.url);
      return NextResponse.redirect(url);
    }
    const payload = await verifyJWT(token, secret);
    if (!payload) {
      const url = new URL("/admin/login", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
