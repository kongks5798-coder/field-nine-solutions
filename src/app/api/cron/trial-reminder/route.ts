import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendTrialExpiringEmail } from "@/lib/email";
import { log } from "@/lib/logger";

// Vercel Cron: 매일 06:00 UTC 실행 — 체험 만료 3일 전 리마인드
export async function GET(req: NextRequest) {
  // CRON_SECRET 검증 — CRON_SECRET 필수 (미설정 시 503)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminClient();
  const now   = new Date();

  // 3일 후 만료 윈도우 (±12시간)
  const reminderFrom = new Date(now); reminderFrom.setDate(reminderFrom.getDate() + 2); reminderFrom.setHours(reminderFrom.getHours() - 12);
  const reminderTo   = new Date(now); reminderTo.setDate(reminderTo.getDate()   + 4); reminderTo.setHours(reminderTo.getHours()   + 12);

  // trial_ends_at이 3일 이내인 미전환 유저 조회
  const { data: trials, error } = await admin
    .from("profiles")
    .select("id, email, plan, trial_ends_at, trial_converted")
    .eq("trial_converted", false)
    .not("trial_ends_at", "is", null)
    .gte("trial_ends_at", reminderFrom.toISOString())
    .lte("trial_ends_at", reminderTo.toISOString());

  if (error) {
    log.error("cron.trial_reminder.query_failed", { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!trials || trials.length === 0) {
    return NextResponse.json({ sent: 0, message: "리마인드 대상 없음" });
  }

  let sent = 0;
  for (const t of trials) {
    if (!t.email || !t.trial_ends_at) continue;
    const daysLeft = Math.ceil((new Date(t.trial_ends_at).getTime() - now.getTime()) / 86_400_000);
    try {
      await sendTrialExpiringEmail(t.email, daysLeft, t.plan ?? "pro");
      sent++;
      log.info("trial_reminder.sent", { uid: t.id, daysLeft });
    } catch (err: unknown) {
      log.warn("trial_reminder.email_failed", { uid: t.id, msg: (err as Error).message });
    }
  }

  return NextResponse.json({ sent, total: trials.length, message: `${sent}명에게 리마인드 이메일 발송` });
}
