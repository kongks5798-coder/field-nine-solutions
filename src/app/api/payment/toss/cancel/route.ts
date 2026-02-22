import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";
import { z } from "zod";

const CancelSchema = z.object({
  cancelReason: z.string().max(200).optional().default("사용자 요청"),
});

export async function POST(req: NextRequest) {
  // ── 인증 ────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { cancelReason } = CancelSchema.parse(body);

  const admin = getAdminClient();
  const uid   = session.user.id;

  // ── 활성 Toss 구독 조회 ──────────────────────────────────────────────────
  const { data: sub, error: subErr } = await admin
    .from("subscriptions")
    .select("id, toss_payment_key, plan, current_period_end")
    .eq("user_id", uid)
    .eq("status", "active")
    .not("toss_payment_key", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: "활성 토스페이먼츠 구독이 없습니다." }, { status: 404 });
  }

  const secretKey = process.env.TOSSPAYMENTS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "결제 서비스 미설정" }, { status: 503 });
  }

  // ── TossPayments 결제 취소 ────────────────────────────────────────────────
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  const tossRes = await fetch(
    `https://api.tosspayments.com/v1/payments/${sub.toss_payment_key}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason }),
    }
  );

  if (!tossRes.ok) {
    const err = await tossRes.json().catch(() => ({}));
    log.error("[TossCancel] 취소 실패", { error: err, uid });
    return NextResponse.json(
      { error: err.message || "취소 처리 중 오류가 발생했습니다." },
      { status: 400 }
    );
  }

  // ── DB 업데이트: cancel_at_period_end = true (기간 만료 후 강등) ─────────
  await admin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      canceled_at:          new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    })
    .eq("id", sub.id);

  // billing_events 기록
  await admin.from("billing_events").insert({
    user_id:     uid,
    type:        "subscription_canceled",
    amount:      0,
    description: `${sub.plan} 플랜 취소 — ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("ko-KR") + "까지 사용 가능" : ""}`,
    metadata:    { cancel_reason: cancelReason, period_end: sub.current_period_end },
  });

  log.billing("toss.subscription.canceled", { uid, plan: sub.plan });

  return NextResponse.json({
    success: true,
    message: `구독이 취소되었습니다. ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("ko-KR") + "까지 이용 가능합니다." : ""}`,
    periodEnd: sub.current_period_end,
  });
}
