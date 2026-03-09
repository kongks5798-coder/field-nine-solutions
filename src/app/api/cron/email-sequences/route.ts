import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReEngagementEmail, sendUpgradeNudgeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  // Verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const now = new Date();
  let sent = 0;

  // ── Day-7 재방문 넛지 ───────────────────────────────────────────────────────
  // Users who signed up 7 days ago (±1 hour) and haven't received day7 email
  const day7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
  const day7End   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

  const { data: day7Users } = await sb
    .from("profiles")
    .select("id, email, name, email_preferences")
    .gte("created_at", day7Start.toISOString())
    .lte("created_at", day7End.toISOString())
    .eq("plan", "starter");

  for (const user of day7Users ?? []) {
    const prefs = (user.email_preferences as Record<string, boolean> | null) ?? {};
    if (prefs.marketing === false || prefs.day7_sent) continue;
    try {
      await sendReEngagementEmail(user.email, user.name ?? "사용자", user.id);
      // Mark as sent
      await sb.from("profiles").update({
        email_preferences: { ...prefs, day7_sent: true },
      }).eq("id", user.id);
      sent++;
    } catch { /* continue */ }
  }

  // ── Day-30 업그레이드 넛지 ─────────────────────────────────────────────────
  // Starter users who signed up 30 days ago and have used AI
  const day30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000);
  const day30End   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000);

  const { data: day30Users } = await sb
    .from("profiles")
    .select("id, email, name, email_preferences")
    .gte("created_at", day30Start.toISOString())
    .lte("created_at", day30End.toISOString())
    .eq("plan", "starter");

  for (const user of day30Users ?? []) {
    const prefs = (user.email_preferences as Record<string, boolean> | null) ?? {};
    if (prefs.marketing === false || prefs.day30_sent) continue;
    try {
      // Count their AI usage
      const { count } = await sb
        .from("usage_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "ai_call");
      const callCount = count ?? 0;
      if (callCount < 3) continue; // Skip inactive users
      await sendUpgradeNudgeEmail(user.email, user.name ?? "사용자", callCount, user.id);
      await sb.from("profiles").update({
        email_preferences: { ...prefs, day30_sent: true },
      }).eq("id", user.id);
      sent++;
    } catch { /* continue */ }
  }

  return NextResponse.json({ ok: true, sent });
}
