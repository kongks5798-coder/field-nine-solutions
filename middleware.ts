import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require Supabase auth
const PROTECTED = ["/workspace", "/team", "/cloud", "/cowork", "/settings", "/ide"];
// Routes that should redirect to /workspace if already logged in
const AUTH_ONLY = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════
  // SUPABASE AUTH — 로그인 세션 체크
  // ══════════════════════════════════════════════════
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    !!supabaseUrl &&
    !!supabaseKey &&
    supabaseUrl !== "https://placeholder.supabase.co";

  if (!isSupabaseConfigured) {
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

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some(p => pathname.startsWith(p));

  // 미인증 사용자 → 보호된 라우트 접근 시 로그인으로 리디렉트
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 인증된 사용자 → 로그인/회원가입 페이지 접근 시 워크스페이스로 리디렉트
  if (isAuthOnly && session) {
    const next = req.nextUrl.searchParams.get("next");
    const dest = next?.startsWith("/") && !next.startsWith("//") ? next : "/workspace";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ══════════════════════════════════════════════════
  // 구독 체크 — 로그인된 사용자가 보호된 라우트 접근 시
  // ══════════════════════════════════════════════════
  if (session && isProtected) {
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
    const userEmail = session.user.email || "";

    // 관리자(오너) 이메일은 구독 없이 접근 가능
    if (!adminEmails.includes(userEmail)) {
      // 캐시 쿠키 확인 (5분 TTL — DB 쿼리 절약)
      const subCache = req.cookies.get("f9_sub")?.value;
      const now = Date.now();
      let isPro = false;

      if (subCache) {
        const [plan, ts] = subCache.split("|");
        if (parseInt(ts) > now - 5 * 60 * 1000) {
          isPro = plan === "pro";
        }
      }

      if (!isPro) {
        // Supabase profiles에서 plan 조회
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single();

        isPro = profile?.plan === "pro";

        // 캐시 쿠키 저장 (5분)
        res.cookies.set("f9_sub", `${isPro ? "pro" : "free"}|${now}`, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 300,
          path: "/",
        });
      }

      if (!isPro) {
        return NextResponse.redirect(new URL("/pricing", req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
