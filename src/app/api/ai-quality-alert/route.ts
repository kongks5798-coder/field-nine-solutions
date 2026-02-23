import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/utils/supabase/admin";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** GET /api/ai-quality-alert — AI 품질 알림 조회 */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolved = req.nextUrl.searchParams.get("resolved");

    let query = admin
      .from("ai_quality_alerts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100);

    if (resolved !== null) {
      query = query.eq("resolved", resolved === "true");
    }

    const { data: alerts, error, count } = await query;

    if (error) throw error;

    // Generate suggestion based on unresolved alerts
    const unresolvedCount = (alerts ?? []).filter((a) => !a.resolved).length;
    let suggestion = "";
    if (unresolvedCount > 10) {
      suggestion = "미해결 알림이 많습니다. 우선순위를 정해 처리하세요.";
    } else if (unresolvedCount > 0) {
      suggestion = "미해결 알림을 확인해 주세요.";
    }

    return NextResponse.json({
      alerts: alerts ?? [],
      total: count ?? 0,
      suggestion,
    });
  } catch {
    // Graceful degradation: table may not exist yet
    return NextResponse.json({ alerts: [], total: 0, suggestion: "" });
  }
}
