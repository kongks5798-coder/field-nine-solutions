import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { log } from "@/lib/logger";

// GET /api/published?limit=20&sort=views|newest&user=me
// user=me → returns only the authenticated user's published apps
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const sort = searchParams.get("sort") === "newest" ? "created_at" : "views";
  const userFilter = searchParams.get("user");

  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  let userId: string | null = null;
  if (userFilter === "me") {
    const cookieStore = await cookies();
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { session } } = await userSupabase.auth.getSession();
    if (!session) return NextResponse.json({ apps: [] });
    userId = session.user.id;
  }

  let query = serviceSupabase
    .from("published_apps")
    .select("slug, name, views, user_id, created_at, updated_at")
    .order(sort, { ascending: false })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;

  if (error) {
    log.warn("[published] 앱 목록 조회 실패", { error: error.message });
    return NextResponse.json({ apps: [] });
  }
  return NextResponse.json({ apps: data ?? [] });
}
