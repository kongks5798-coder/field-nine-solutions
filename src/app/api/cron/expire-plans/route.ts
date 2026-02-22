import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

// Vercel Cron: 매일 04:00 UTC 실행 — plan_expires_at 지난 Toss 구독 강등
export async function GET(req: NextRequest) {
  // CRON_SECRET 검증 (Vercel cron은 Authorization: Bearer {secret} 헤더 전송)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = getAdminClient();
  const now   = new Date().toISOString();

  // 만료된 플랜 조회: plan_expires_at 지났고, Stripe 활성 구독 없는 유저
  const { data: expiredProfiles, error } = await admin
    .from("profiles")
    .select("id, plan, plan_expires_at")
    .not("plan", "is", null)
    .lt("plan_expires_at", now);

  if (error) {
    log.error("cron.expire_plans.query_failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expiredProfiles || expiredProfiles.length === 0) {
    log.info("cron.expire_plans.none_expired", {});
    return NextResponse.json({ expired: 0, message: "만료된 플랜 없음" });
  }

  // 각 만료 유저 처리
  let expiredCount = 0;
  for (const profile of expiredProfiles) {
    // Stripe 활성 구독이 있으면 제외 (Stripe webhook이 처리)
    const { data: stripeSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .not("stripe_subscription_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (stripeSub) continue; // Stripe 구독 있으면 건너뜀

    // plan → null 강등
    await admin
      .from("profiles")
      .update({ plan: null, plan_updated_at: now })
      .eq("id", profile.id);

    // Toss 구독 상태 업데이트
    await admin
      .from("subscriptions")
      .update({ status: "canceled", updated_at: now })
      .eq("user_id", profile.id)
      .eq("status", "active")
      .not("toss_payment_key", "is", null);

    // billing_events 기록
    await admin.from("billing_events").insert({
      user_id:     profile.id,
      type:        "subscription_canceled",
      amount:      0,
      description: `${profile.plan} 플랜 만료 — 자동 강등`,
      metadata:    { expired_at: profile.plan_expires_at, reason: "plan_expired" },
    });

    expiredCount++;
    log.billing("toss.plan.expired", { uid: profile.id, plan: profile.plan });
  }

  return NextResponse.json({
    expired: expiredCount,
    total:   expiredProfiles.length,
    message: `${expiredCount}명의 플랜이 강등되었습니다.`,
  });
}
