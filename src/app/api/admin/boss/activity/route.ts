/**
 * GET /api/admin/boss/activity
 * Boss Dashboard — 실시간 임직원 활동 모니터링 API
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = getAdminClient();

  // 부서별 통계 (최근 24시간)
  const { data: deptStats } = await admin
    .from("employee_activity")
    .select("department, action_type, user_id, created_at, metadata")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  // 최근 20건 피드
  const { data: feed } = await admin
    .from("employee_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // 부서별 집계
  const departments: Record<
    string,
    { members: Set<string>; builds: number; aiQueries: number; lastActivity: string }
  > = {};

  for (const row of deptStats ?? []) {
    if (!departments[row.department]) {
      departments[row.department] = {
        members: new Set(),
        builds: 0,
        aiQueries: 0,
        lastActivity: row.created_at,
      };
    }
    const d = departments[row.department];
    d.members.add(row.user_id);
    if (row.action_type === "build" || row.action_type === "deploy") d.builds++;
    if (row.action_type === "ai_query") d.aiQueries++;
    if (row.created_at > d.lastActivity) d.lastActivity = row.created_at;
  }

  const deptArray = Object.entries(departments).map(([name, d]) => ({
    department: name,
    activeMembers: d.members.size,
    builds: d.builds,
    aiQueries: d.aiQueries,
    lastActivity: d.lastActivity,
  }));

  const totalUsers = new Set((deptStats ?? []).map((r) => r.user_id)).size;
  const totalBuilds = (deptStats ?? []).filter(
    (r) => r.action_type === "build" || r.action_type === "deploy",
  ).length;
  const totalAiQueries = (deptStats ?? []).filter(
    (r) => r.action_type === "ai_query",
  ).length;
  const totalTokens = (deptStats ?? []).reduce(
    (sum, r) => sum + (r.metadata?.tokens ?? 0),
    0,
  );

  return NextResponse.json({
    kpi: { totalUsers, totalBuilds, totalAiQueries, totalTokens },
    departments: deptArray,
    feed: feed ?? [],
  });
}
