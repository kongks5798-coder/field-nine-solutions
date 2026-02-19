import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require auth
const PROTECTED = ["/workspace", "/team", "/cloud", "/cowork", "/settings"];
// Routes that should redirect to /workspace if already logged in
const AUTH_ONLY = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Only apply Supabase session check when configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    !!supabaseUrl &&
    !!supabaseKey &&
    supabaseUrl !== "https://placeholder.supabase.co";

  if (!isConfigured) {
    // Dev mode: no server-side auth check, let client handle it
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect authenticated users away from auth pages
  const isAuthOnly = AUTH_ONLY.some(p => pathname.startsWith(p));
  if (isAuthOnly && session) {
    return NextResponse.redirect(new URL("/workspace", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
