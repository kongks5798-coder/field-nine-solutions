import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendPaymentSuccessEmail } from "@/lib/email";
import { PLAN_PRICES, PLAN_VALID_AMOUNTS, PLAN_TOKENS } from "@/lib/plans";
import { log } from "@/lib/logger";
import { TOSS_API_BASE } from "@/lib/constants";



// 플랜별 월 토큰 할당량 (결제 성공 시 지급)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentKey = searchParams.get("paymentKey");
  const orderId    = searchParams.get("orderId");
  const amount     = searchParams.get("amount");
  const rawPlan    = searchParams.get("plan") ?? "";

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(new URL("/pricing?error=missing_params", req.url));
  }

  // plan 파라미터 allowlist 검증
  const ALLOWED_PLANS = ["pro", "team"] as const;
  if (!ALLOWED_PLANS.includes(rawPlan as (typeof ALLOWED_PLANS)[number])) {
    log.security("payment.confirm.invalid_plan", { rawPlan, orderId });
    return NextResponse.redirect(new URL("/pricing?error=invalid_plan", req.url));
  }
  const plan: string = rawPlan;

  // 서버 측 금액 검증 — 클라이언트 조작 방지
  const parsedAmount = parseInt(amount);
  if (!PLAN_VALID_AMOUNTS[plan]?.includes(parsedAmount)) {
    log.security("payment.confirm.amount_mismatch", { plan, amount: parsedAmount, orderId });
    return NextResponse.redirect(new URL("/pricing?error=amount_mismatch", req.url));
  }

  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;
  if (!secretKey) {
    log.error("[Payment] TOSSPAYMENTS_SECRET_KEY 미설정 — 결제 처리 불가");
    return NextResponse.redirect(new URL("/pricing?error=payment_unavailable", req.url));
  }

  // ── TossPayments 결제 승인 ────────────────────────────────────────────────
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  const tossRes = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: parsedAmount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json().catch(() => ({}));
    log.error("[Payment] TossPayments 승인 실패", { error: err, orderId });
    return NextResponse.redirect(
      new URL(`/pricing?error=${encodeURIComponent(err.message || "payment_failed")}`, req.url)
    );
  }

  // TossPayments 응답 파싱 (paymentKey, orderId 등)
  const paymentResponse = await tossRes.json().catch(() => ({}));

  // ── 사용자 인증 ───────────────────────────────────────────────────────────
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

  const admin   = getAdminClient();
  const uid     = session.user.id;

  // ── IDOR 방지: orderId가 현재 사용자 소유인지 검증 ──────────────────────
  // TossPayments 관례: orderId는 "userId_timestamp" 또는 "userId-..." 형식
  if (!orderId.startsWith(`${uid}_`) && !orderId.startsWith(`${uid}-`)) {
    log.security("payment.confirm.idor_attempt", {
      uid,
      orderId,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });
    return NextResponse.json(
      { error: "주문 정보가 현재 사용자와 일치하지 않습니다." },
      { status: 403 }
    );
  }
  const now     = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + 1);
  const period  = now.toISOString().slice(0, 7); // YYYY-MM

  const prices = PLAN_PRICES[plan];

  // ── 1. profiles 업데이트 ─────────────────────────────────────────────────
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({
      id:              uid,
      plan,
      plan_expires_at: expires.toISOString(),
      plan_updated_at: now.toISOString(),
    }, { onConflict: "id" });

  if (profileErr) {
    log.error("[Payment] profiles 업데이트 실패", { error: profileErr.message, uid });
    return NextResponse.redirect(new URL("/pricing?error=db_failed", req.url));
  }

  // ── 2. subscriptions upsert (Toss 구독 기록) ─────────────────────────────
  await admin.from("subscriptions").upsert({
    user_id:              uid,
    plan,
    status:               "active",
    toss_payment_key:     paymentKey,
    toss_order_id:        orderId,
    original_price:       prices.original,
    discounted_price:     prices.discounted,
    current_period_start: now.toISOString(),
    current_period_end:   expires.toISOString(),
    cancel_at_period_end: false,
    updated_at:           now.toISOString(),
  }, { onConflict: "toss_order_id", ignoreDuplicates: false });

  // ── 3. billing_events 기록 ───────────────────────────────────────────────
  await admin.from("billing_events").insert({
    user_id:     uid,
    type:        "payment_succeeded",
    amount:      parsedAmount,
    description: `${plan} 플랜 구독 (TossPayments)`,
    metadata:    {
      toss_payment_key:  paymentKey,
      toss_order_id:     orderId,
      payment_method:    paymentResponse.method ?? "CARD",
      billing_period:    period,
    },
  });

  log.billing("toss.payment.confirmed", { uid, plan, amount: parsedAmount, orderId });

  // ── 4. 토큰 충전 (플랜별 월 할당량 지급) ─────────────────────────────────
  const tokensToAdd = PLAN_TOKENS[plan] ?? 0;
  if (tokensToAdd > 0) {
    // 현재 잔액 조회 후 누적 지급 (기존 잔액 보존)
    const { data: tokenRow } = await admin
      .from("user_tokens")
      .select("balance")
      .eq("user_id", uid)
      .maybeSingle();

    const newBalance = (tokenRow?.balance ?? 0) + tokensToAdd;
    await admin.from("user_tokens").upsert(
      { user_id: uid, balance: newBalance, updated_at: now.toISOString() },
      { onConflict: "user_id" }
    );
    log.billing("tokens.allocated", { uid, plan, tokensAdded: tokensToAdd, newBalance });
  }

  // ── 6. 결제 성공 이메일 ──────────────────────────────────────────────────
  try {
    const userEmail = (await admin.auth.admin.getUserById(uid)).data.user?.email;
    if (userEmail) {
      await sendPaymentSuccessEmail(userEmail, plan, parsedAmount, period);
    }
  } catch (emailErr: unknown) {
    log.warn("email.toss_payment_success.failed", { uid, msg: (emailErr as Error).message });
  }

  // ── 7. 캐시 쿠키 초기화 후 워크스페이스로 리다이렉트 ───────────────────
  const res = NextResponse.redirect(new URL("/workspace?welcome=1", req.url));
  res.cookies.set("f9_sub", `${plan}|${Date.now()}`, {
    httpOnly: true,
    secure:   true,
    sameSite: "lax",
    maxAge:   300,
    path:     "/",
  });

  return res;
}
