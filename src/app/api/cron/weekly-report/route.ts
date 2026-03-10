import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklyReportEmail } from "@/lib/email";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 매주 월요일 09:00 KST (00:00 UTC) 실행
// vercel.json: { "path": "/api/cron/weekly-report", "schedule": "0 0 * * 1" }
export async function GET(req: Request) {
  // CRON_SECRET 미설정 시 503 반환 (인증 우회 방지)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const now = new Date();

  // 이번 주 월요일 00:00 UTC
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  // 최근 30일 이내 로그인한 활성 사용자 조회
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: users, error: usersErr } = await sb
    .from("profiles")
    .select("id, email, name, email_preferences, last_login_at")
    .gte("last_login_at", thirtyDaysAgo.toISOString());

  if (usersErr) {
    log.error("[weekly-report] 사용자 조회 실패", { err: usersErr.message });
    return NextResponse.json({ error: "users query failed" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const user of users ?? []) {
    // 이메일 수신 동의 확인
    const prefs = (user.email_preferences as Record<string, boolean> | null) ?? {};
    if (prefs.weekly_report === false || prefs.marketing === false) {
      skipped++;
      continue;
    }

    try {
      // 해당 사용자의 published_apps 통계 직접 쿼리
      const { data: apps } = await sb
        .from("published_apps")
        .select("slug, name, views, likes, created_at")
        .eq("user_id", user.id)
        .order("views", { ascending: false });

      const allApps = apps ?? [];
      if (allApps.length === 0) {
        skipped++;
        continue; // 앱이 없는 사용자 스킵
      }

      const totalApps  = allApps.length;
      const totalViews = allApps.reduce((sum, a) => sum + (a.views ?? 0), 0);
      const topApp     = allApps[0]
        ? { name: allApps[0].name, views: allApps[0].views ?? 0 }
        : undefined;

      // 이번 주 생성 수
      const weeklyCreated = allApps.filter(
        (a) => new Date(a.created_at) >= weekStart
      ).length;

      await sendWeeklyReportEmail({
        to:            user.email,
        userName:      user.name ?? undefined,
        totalApps,
        totalViews,
        topApp,
        weeklyCreated,
        userId:        user.id,
      });

      sent++;
    } catch (err) {
      log.error("[weekly-report] 이메일 발송 실패", {
        userId: user.id,
        err:    (err as Error).message,
      });
    }
  }

  log.info("[weekly-report] 완료", { sent, skipped, total: (users ?? []).length });
  return NextResponse.json({ ok: true, sent, skipped });
}
