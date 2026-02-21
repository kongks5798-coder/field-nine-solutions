import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    + "-" + Math.random().toString(36).slice(2, 6);
}

// POST /api/projects/publish
// Body: { projectId, name, html }
// Returns: { slug, url }
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Size guard (5MB max)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 5_000_000) {
    return NextResponse.json({ error: "HTML too large (max 5MB)" }, { status: 413 });
  }

  const body = await req.json().catch(() => ({}));
  const { projectId, name, html } = body as { projectId?: string; name?: string; html?: string };

  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "name required (max 100 chars)" }, { status: 400 });
  }
  if (!html || typeof html !== "string" || html.length > 2_000_000) {
    return NextResponse.json({ error: "html required (max 2MB)" }, { status: 400 });
  }

  const slug = toSlug(name);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fieldnine.io";

  const { error } = await supabase.from("published_apps").upsert(
    {
      slug,
      user_id: session.user.id,
      project_id: projectId ?? null,
      name,
      html,
      views: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );

  if (error) return NextResponse.json({ error: "배포에 실패했습니다." }, { status: 500 });

  return NextResponse.json({ slug, url: `${appUrl}/p/${slug}` });
}
