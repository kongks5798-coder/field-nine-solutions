import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// GET /api/apps/mine — returns the authenticated user's published apps with analytics
export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data, error } = await serviceSupabase
    .from("published_apps")
    .select("slug, name, views, likes, forks, created_at, updated_at")
    .eq("user_id", userId)
    .order("views", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }

  const res = NextResponse.json({ apps: data ?? [] });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
