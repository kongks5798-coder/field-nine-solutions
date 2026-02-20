import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// TossPayments 결제 확인 API
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const plan = searchParams.get("plan") || "pro";

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL("/pricing?error=missing_params", req.url));
  }

  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;

  if (!secretKey) {
    // TossPayments 미설정 시 개발 모드 — plan만 업데이트
    console.warn("[Payment] TOSSPAYMENTS_SECRET_KEY 미설정 — 개발 모드로 처리");
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
      console.error("[Payment] TossPayments 승인 실패:", err);
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

  const { error } = await adminClient
    .from("profiles")
    .upsert({
      id: session.user.id,
      plan,
      plan_updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) {
    console.error("[Payment] Supabase 업데이트 실패:", error);
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
