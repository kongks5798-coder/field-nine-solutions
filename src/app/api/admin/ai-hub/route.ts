import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { admin } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const range = req.nextUrl.searchParams.get("range") ?? "7d";
  const days = range === "30d" ? 30 : range === "24h" ? 1 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: usage } = await admin
    .from("ai_tool_usage")
    .select("department, tool_name, tokens_used, cost_usd, request_type, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);

  // 도구별 집계
  const byTool: Record<string, { count: number; tokens: number; cost: number }> = {};
  const byDept: Record<string, { count: number; tokens: number; cost: number }> = {};
  const byType: Record<string, number> = {};

  for (const r of usage ?? []) {
    // Tool
    if (!byTool[r.tool_name]) byTool[r.tool_name] = { count: 0, tokens: 0, cost: 0 };
    byTool[r.tool_name].count++;
    byTool[r.tool_name].tokens += r.tokens_used;
    byTool[r.tool_name].cost += Number(r.cost_usd);
    // Department
    if (!byDept[r.department]) byDept[r.department] = { count: 0, tokens: 0, cost: 0 };
    byDept[r.department].count++;
    byDept[r.department].tokens += r.tokens_used;
    byDept[r.department].cost += Number(r.cost_usd);
    // Type
    byType[r.request_type] = (byType[r.request_type] ?? 0) + 1;
  }

  const totalTokens = (usage ?? []).reduce((s, r) => s + r.tokens_used, 0);
  const totalCost = (usage ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);

  return NextResponse.json({
    summary: { totalRequests: (usage ?? []).length, totalTokens, totalCost: +totalCost.toFixed(4) },
    byTool: Object.entries(byTool).map(([name, v]) => ({ tool: name, ...v, cost: +v.cost.toFixed(4) })),
    byDepartment: Object.entries(byDept).map(([dept, v]) => ({ department: dept, ...v, cost: +v.cost.toFixed(4) })),
    byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    range,
  });
}
