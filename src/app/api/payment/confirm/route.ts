import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { log } from "@/lib/logger";

// TossPayments 결제 확인 API
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const rawPlan = searchParams.get("plan") ?? "";

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL("/pricing?error=missing_params", req.url));
  }

  // plan 파라미터 allowlist 검증 (임의 plan 설정 방지)
  const ALLOWED_PLANS = ["pro", "team"] as const;
  if (!ALLOWED_PLANS.includes(rawPlan as (typeof ALLOWED_PLANS)[number])) {
    log.security("payment.confirm.invalid_plan", { rawPlan, orderId });
    return NextResponse.redirect(new URL("/pricing?error=invalid_plan", req.url));
  }
  const plan: string = rawPlan;

  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;

  if (!secretKey) {
    // TossPayments 미설정 시 개발 모드 — plan만 업데이트
    log.warn("[Payment] TOSSPAYMENTS_SECRET_KEY 미설정 — 개발 모드로 처리");
  } else {
    // TossPayments 결제 승인 요청
    const encoded = Buffer.from(`${secretKey}:`).toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
    });

    if (!tossRes.ok) {
      const err = await tossRes.json();
      log.error("[Payment] TossPayments 승인 실패", { error: err });
      return NextResponse.redirect(
        new URL(`/pricing?error=${encodeURIComponent(err.message || "payment_failed")}`, req.url)
      );
    }
  }

  // Supabase에 plan 업데이트
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/pricing", req.url));
  }

  // Service role key로 업데이트 (RLS 우회)
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );

  // plan_expires_at: 1개월 후
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error } = await adminClient
    .from("profiles")
    .upsert({
      id: session.user.id,
      plan,
      plan_expires_at: expiresAt.toISOString(),
    }, { onConflict: "id" });

  if (error) {
    log.error("[Payment] Supabase 업데이트 실패", { error: error.message });
    return NextResponse.redirect(new URL("/pricing?error=db_failed", req.url));
  }

  // 구독 캐시 쿠키 초기화 (미들웨어 캐시 무효화)
  const res = NextResponse.redirect(new URL("/workspace", req.url));
  res.cookies.set("f9_sub", `${plan}|${Date.now()}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return res;
}
