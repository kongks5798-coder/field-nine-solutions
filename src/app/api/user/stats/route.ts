import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { log } from "@/lib/logger";

// GET /api/user/stats
// 사용자의 전체 앱 수, 총 조회수, 총 좋아요, 이번 주 생성 수, 가장 인기 앱 TOP 3
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
    // 이번 주 월요일 00:00 UTC 계산
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=일, 1=월 ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysFromMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const [appsRes, weeklyRes] = await Promise.all([
      // 전체 앱 (views + likes 포함)
      supabase
        .from("published_apps")
        .select("slug, name, views, likes, created_at")
        .eq("user_id", uid)
        .order("views", { ascending: false }),
      // 이번 주 생성된 앱 수
      supabase
        .from("published_apps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .gte("created_at", weekStart.toISOString()),
    ]);

    const apps = appsRes.data ?? [];
    const weeklyCreated = weeklyRes.count ?? 0;

    const totalApps  = apps.length;
    const totalViews = apps.reduce((sum, a) => sum + (a.views ?? 0), 0);
    const totalLikes = apps.reduce((sum, a) => sum + (a.likes ?? 0), 0);

    const topApps = apps.slice(0, 3).map((a) => ({
      slug:  a.slug,
      name:  a.name,
      views: a.views ?? 0,
      likes: a.likes ?? 0,
    }));

    return NextResponse.json({
      totalApps,
      totalViews,
      totalLikes,
      weeklyCreated,
      topApps,
    });
  } catch (err) {
    log.error("[user/stats] 통계 조회 실패", { uid, err: (err as Error).message });
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
