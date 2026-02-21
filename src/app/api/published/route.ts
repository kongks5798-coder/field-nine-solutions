import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  if (error) return NextResponse.json({ apps: [] });
  return NextResponse.json({ apps: data ?? [] });
}
