/**
 * GET /api/admin/metrics
 * Returns aggregated metrics for admin dashboard.
 * Auth: admin only — JWT cookie (requireAdmin) or ADMIN_EMAILS env fallback.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

const PRO_PRICE_KRW = 39_000;

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
  const day30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    proCountResult,
    teamCountResult,
    cancelledResult,
    totalPaidResult,
    newPayers30dResult,
    dauResult,
    mauResult,
    topAppsResult,
    genStartedResult,
    genCompletedResult,
  ] = await Promise.allSettled([
    // MRR base: Pro plan users
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "pro"),
    // Team plan users (counted at same price for ARPU)
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("plan", "team"),
    // Churn: subscription_canceled events
    admin.from("billing_events").select("id", { count: "exact", head: true }).eq("type", "subscription_canceled"),
    // Total ever-paying users (had at least one payment_succeeded)
    admin.from("billing_events").select("user_id", { count: "exact", head: false }).eq("type", "payment_succeeded"),
    // New paying users last 30 days
    admin.from("billing_events")
      .select("user_id", { count: "exact", head: false })
      .eq("type", "payment_succeeded")
      .gte("created_at", day30Start),
    // DAU: distinct users with activity today
    admin.from("audit_log")
      .select("user_id", { count: "exact", head: false })
      .gte("created_at", todayStart),
    // MAU: distinct users with activity this month
    admin.from("audit_log")
      .select("user_id", { count: "exact", head: false })
      .gte("created_at", monthStart),
    // Top 5 apps today by view (published_apps with most recent views)
    admin.from("published_apps")
      .select("slug, name, view_count")
      .order("view_count", { ascending: false })
      .limit(5),
    // Generation events started today
    admin.from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "generation_started")
      .gte("created_at", todayStart),
    // Generation events completed today
    admin.from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "generation_completed")
      .gte("created_at", todayStart),
  ]);

  // ── MRR ──
  const proCount = proCountResult.status === "fulfilled" ? (proCountResult.value.count ?? 0) : 0;
  const teamCount = teamCountResult.status === "fulfilled" ? (teamCountResult.value.count ?? 0) : 0;
  const mrr = (proCount + teamCount) * PRO_PRICE_KRW;

  // ── New payers 30d ──
  let newPayers30d = 0;
  if (newPayers30dResult.status === "fulfilled" && newPayers30dResult.value.data) {
    const uniqueNew = new Set(
      (newPayers30dResult.value.data as Array<{ user_id: string }>).map((r) => r.user_id)
    );
    newPayers30d = uniqueNew.size;
  }

  // ── Churn rate ──
  let totalEverPaid = 0;
  if (totalPaidResult.status === "fulfilled" && totalPaidResult.value.data) {
    const uniquePaid = new Set(
      (totalPaidResult.value.data as Array<{ user_id: string }>).map((r) => r.user_id)
    );
    totalEverPaid = uniquePaid.size;
  }
  const cancelledCount = cancelledResult.status === "fulfilled" ? (cancelledResult.value.count ?? 0) : 0;
  const churnRate = totalEverPaid > 0 ? cancelledCount / totalEverPaid : 0;

  // ── ARPU ──
  const totalPaying = proCount + teamCount;
  const arpu = totalPaying > 0 ? Math.round(mrr / totalPaying) : 0;

  // ── DAU / MAU ──
  let dau = 0;
  if (dauResult.status === "fulfilled" && dauResult.value.data) {
    const uniqueUsers = new Set(
      (dauResult.value.data as Array<{ user_id: string }>).map((r) => r.user_id)
    );
    dau = uniqueUsers.size;
  }
  let mau = 0;
  if (mauResult.status === "fulfilled" && mauResult.value.data) {
    const uniqueUsers = new Set(
      (mauResult.value.data as Array<{ user_id: string }>).map((r) => r.user_id)
    );
    mau = uniqueUsers.size;
  }

  // ── Top apps ──
  type TopAppRow = { slug: string; name: string; view_count: number | null };
  const topApps: Array<{ slug: string; views: number; name: string }> =
    topAppsResult.status === "fulfilled" && topAppsResult.value.data
      ? (topAppsResult.value.data as TopAppRow[]).map((r) => ({
          slug: r.slug,
          name: r.name ?? r.slug,
          views: r.view_count ?? 0,
        }))
      : [];

  // ── Generation success rate ──
  const genStarted =
    genStartedResult.status === "fulfilled" ? (genStartedResult.value.count ?? 0) : 0;
  const genCompleted =
    genCompletedResult.status === "fulfilled" ? (genCompletedResult.value.count ?? 0) : 0;
  const generationSuccessRate = genStarted > 0 ? genCompleted / genStarted : 1;

  const res = NextResponse.json({
    mrr,
    newPayers30d,
    churnRate,
    arpu,
    dau,
    mau,
    topApps,
    generationSuccessRate,
  });
  res.headers.set("Cache-Control", "private, max-age=120");
  return res;
}
