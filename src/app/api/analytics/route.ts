import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { log } from "@/lib/logger";

// GET /api/analytics — user's real stats
export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  try {
    // Parallel queries
    const [appsRes, projectsRes, tokensRes] = await Promise.all([
      supabase
        .from("published_apps")
        .select("slug, name, views, created_at, updated_at")
        .eq("user_id", uid)
        .order("views", { ascending: false }),
      supabase
        .from("projects")
        .select("id, name, updated_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false }),
      supabase
        .from("user_tokens")
        .select("balance")
        .eq("user_id", uid)
        .single(),
    ]);

    const apps = appsRes.data ?? [];
    const projects = projectsRes.data ?? [];
    const tokenBalance = tokensRes.data?.balance ?? 50000;

    const totalViews = apps.reduce((sum, a) => sum + (a.views ?? 0), 0);

    return NextResponse.json({
      totalViews,
      appCount: apps.length,
      projectCount: projects.length,
      tokenBalance,
      apps,
      projects,
    });
  } catch (err) {
    log.error("[analytics] 통계 조회 실패", { uid, err: (err as Error).message });
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
