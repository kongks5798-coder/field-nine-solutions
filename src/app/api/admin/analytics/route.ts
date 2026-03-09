import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Build last 14 days date array
  const days14: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days14.push(d.toISOString().slice(0, 10));
  }
  const day14Start = days14[0] + "T00:00:00.000Z";

  // Run all queries in parallel
  const [
    dauResult,
    mauResult,
    totalAppsResult,
    appsThisWeekResult,
    topTemplatesResult,
    aiModelResult,
    dailySignupsResult,
    dailyAppsResult,
  ] = await Promise.allSettled([
    // DAU: distinct users in profiles created today OR audit_log today
    admin.from("audit_log")
      .select("user_id", { count: "exact", head: false })
      .gte("created_at", todayStart),

    // MAU: distinct users in audit_log this month
    admin.from("audit_log")
      .select("user_id", { count: "exact", head: false })
      .gte("created_at", monthStart),

    // Total published apps
    admin.from("published_apps")
      .select("id", { count: "exact", head: true }),

    // Apps this week
    admin.from("published_apps")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekStart),

    // Top 5 templates by name (published_apps names)
    admin.from("published_apps")
      .select("name")
      .order("created_at", { ascending: false })
      .limit(200),

    // AI model usage from usage_records
    admin.from("usage_records")
      .select("model"),

    // Daily signups: last 14 days from profiles.created_at
    admin.from("profiles")
      .select("created_at")
      .gte("created_at", day14Start),

    // Daily apps: last 14 days from published_apps.created_at
    admin.from("published_apps")
      .select("created_at")
      .gte("created_at", day14Start),
  ]);

  // ── DAU ──
  let dau = 0;
  if (dauResult.status === "fulfilled" && dauResult.value.data) {
    const uniqueUsers = new Set(dauResult.value.data.map((r: { user_id: string }) => r.user_id));
    dau = uniqueUsers.size;
    // fallback: try profiles created_at today if audit_log empty
    if (dau === 0) {
      const fallback = await admin.from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart);
      dau = fallback.count ?? 0;
    }
  }

  // ── MAU ──
  let mau = 0;
  if (mauResult.status === "fulfilled" && mauResult.value.data) {
    const uniqueUsers = new Set(mauResult.value.data.map((r: { user_id: string }) => r.user_id));
    mau = uniqueUsers.size;
    if (mau === 0) {
      const fallback = await admin.from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart);
      mau = fallback.count ?? 0;
    }
  }

  // ── Total apps ──
  const totalApps =
    totalAppsResult.status === "fulfilled"
      ? (totalAppsResult.value.count ?? 0)
      : 0;

  // ── Apps this week ──
  const appsThisWeek =
    appsThisWeekResult.status === "fulfilled"
      ? (appsThisWeekResult.value.count ?? 0)
      : 0;

  // ── Top templates ──
  let topTemplates: Array<{ name: string; count: number }> = [];
  if (topTemplatesResult.status === "fulfilled" && topTemplatesResult.value.data) {
    const nameCounts: Record<string, number> = {};
    for (const row of topTemplatesResult.value.data as Array<{ name: string }>) {
      if (row.name) {
        nameCounts[row.name] = (nameCounts[row.name] ?? 0) + 1;
      }
    }
    topTemplates = Object.entries(nameCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  // ── AI model usage ──
  let aiModelUsage: Array<{ model: string; count: number }> = [];
  if (aiModelResult.status === "fulfilled" && aiModelResult.value.data) {
    const modelCounts: Record<string, number> = {};
    for (const row of aiModelResult.value.data as Array<{ model?: string }>) {
      const m = row.model ?? "unknown";
      modelCounts[m] = (modelCounts[m] ?? 0) + 1;
    }
    aiModelUsage = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([model, count]) => ({ model, count }));
  }

  // ── Daily signups ──
  const signupsByDay: Record<string, number> = {};
  days14.forEach(d => { signupsByDay[d] = 0; });
  if (dailySignupsResult.status === "fulfilled" && dailySignupsResult.value.data) {
    for (const row of dailySignupsResult.value.data as Array<{ created_at: string }>) {
      const day = row.created_at.slice(0, 10);
      if (day in signupsByDay) signupsByDay[day]++;
    }
  }
  const dailySignups = days14.map(date => ({ date, count: signupsByDay[date] }));

  // ── Daily apps ──
  const appsByDay: Record<string, number> = {};
  days14.forEach(d => { appsByDay[d] = 0; });
  if (dailyAppsResult.status === "fulfilled" && dailyAppsResult.value.data) {
    for (const row of dailyAppsResult.value.data as Array<{ created_at: string }>) {
      const day = row.created_at.slice(0, 10);
      if (day in appsByDay) appsByDay[day]++;
    }
  }
  const dailyApps = days14.map(date => ({ date, count: appsByDay[date] }));

  const res = NextResponse.json({
    dau,
    mau,
    totalApps,
    appsThisWeek,
    topTemplates,
    aiModelUsage,
    dailySignups,
    dailyApps,
  });
  res.headers.set("Cache-Control", "private, max-age=300");
  return res;
}
