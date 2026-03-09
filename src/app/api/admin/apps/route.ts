import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";

// GET /api/admin/apps — 배포된 앱 목록
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const admin = getAdminClient();
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const sort   = searchParams.get("sort") ?? "newest";
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = admin
    .from("published_apps")
    .select("slug, name, views, user_id, created_at, updated_at, profiles!inner(email, plan)", { count: "exact" })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  if (sort === "views") {
    query = query.order("views", { ascending: false });
  } else if (sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ apps: data ?? [], total: count ?? 0, offset, limit });
}

// DELETE /api/admin/apps?slug=xxx — 앱 삭제
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const admin = getAdminClient();

  // 관련 댓글/좋아요도 함께 삭제
  await Promise.all([
    admin.from("app_comments").delete().eq("slug", slug),
    admin.from("app_likes").delete().eq("slug", slug),
  ]);

  const { error } = await admin.from("published_apps").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, slug });
}
