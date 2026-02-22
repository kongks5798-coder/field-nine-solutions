import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { log } from "@/lib/logger";

// Public endpoint — no auth required
// GET /api/published?limit=20&sort=views|newest
export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const sort = searchParams.get("sort") === "newest" ? "created_at" : "views";

  const { data, error } = await supabase
    .from("published_apps")
    .select("slug, name, views, user_id, created_at, updated_at")
    .order(sort, { ascending: false })
    .limit(limit);

  if (error) {
    log.warn("[published] 앱 목록 조회 실패", { error: error.message });
    return NextResponse.json({ apps: [] });
  }
  return NextResponse.json({ apps: data ?? [] });
}
