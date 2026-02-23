import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const now   = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    { count: totalUsers },
    { data: planDist },
    { data: thisMonthEvents },
    { data: lastMonthEvents },
    { data: recentEvents },
    { count: activeSubs },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("plan").not("plan", "is", null),
    admin.from("billing_events").select("amount, type").eq("type", "payment_succeeded").gte("created_at", monthStart),
    admin.from("billing_events").select("amount, type").eq("type", "payment_succeeded").gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    admin.from("billing_events").select("id, user_id, type, amount, description, created_at, profiles!inner(email)").order("created_at", { ascending: false }).limit(10),
    admin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const mrr      = (thisMonthEvents ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const lastMrr  = (lastMonthEvents ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const mrrGrowth = lastMrr > 0 ? Math.round(((mrr - lastMrr) / lastMrr) * 100) : 0;

  const proUsers  = (planDist ?? []).filter(p => p.plan === "pro").length;
  const teamUsers = (planDist ?? []).filter(p => p.plan === "team").length;
  const paidUsers = proUsers + teamUsers;
  const freeUsers = (totalUsers ?? 0) - paidUsers;

  // 시스템 상태 체크
  const systemStatus = {
    supabase:    !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    toss:        !!(process.env.TOSSPAYMENTS_SECRET_KEY),
    stripe:      !!(process.env.STRIPE_SECRET_KEY),
    openai:      !!(process.env.OPENAI_API_KEY),
    anthropic:   !!(process.env.ANTHROPIC_API_KEY),
    gemini:      !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    resend:      !!(process.env.RESEND_API_KEY),
    sentry:      !!(process.env.SENTRY_DSN),
    upstash:     !!(process.env.UPSTASH_REDIS_REST_URL),
  };

  const res = NextResponse.json({
    users:  { total: totalUsers ?? 0, paid: paidUsers, free: freeUsers, pro: proUsers, team: teamUsers },
    revenue: { mrr, lastMrr, mrrGrowth },
    activeSubs: activeSubs ?? 0,
    recentEvents: recentEvents ?? [],
    systemStatus,
  });
  res.headers.set('Cache-Control', 'private, max-age=30');
  return res;
}
