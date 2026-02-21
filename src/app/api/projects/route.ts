import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// GET /api/projects — list user's projects
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ projects: [] });

  const { data, error } = await supabase
    .from("workspace_projects")
    .select("id, name, updated_at, created_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

// POST /api/projects — upsert project
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Size guard before parsing (1MB max)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 1_000_000) {
    return NextResponse.json({ error: "Request too large (max 1MB)" }, { status: 413 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, name, files, updatedAt } = body as {
    id?: string; name?: string;
    files?: Record<string, unknown>; updatedAt?: string;
  };

  // Input validation — accept UUID v4 format (matches Supabase projects.id UUID column)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!id || typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid project id (must be UUID v4)" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.length > 100) {
    return NextResponse.json({ error: "name required (max 100 chars)" }, { status: 400 });
  }

  // Check JSON size of files (max 500KB)
  const filesJson = JSON.stringify(files ?? {});
  if (filesJson.length > 500_000) {
    return NextResponse.json({ error: "Project too large (max 500KB)" }, { status: 413 });
  }

  const { error } = await supabase.from("workspace_projects").upsert(
    {
      id,
      user_id: session.user.id,
      name: name.trim().slice(0, 100),
      files: files ?? {},
      updated_at: updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
