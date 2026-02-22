import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ProjectUpsertSchema = z.object({
  id:        z.string().regex(UUID_RE, "Invalid project id"),
  name:      z.string().min(1).max(100),
  files:     z.record(z.string(), z.unknown()).optional().default({}),
  updatedAt: z.string().optional(),
});

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
    .from("projects")
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

  const raw = await req.json().catch(() => ({}));
  const projParsed = ProjectUpsertSchema.safeParse(raw);
  if (!projParsed.success) {
    const msg = projParsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { id, name, files, updatedAt } = projParsed.data;

  // Check JSON size of files (max 500KB)
  const filesJson = JSON.stringify(files);
  if (filesJson.length > 500_000) {
    return NextResponse.json({ error: "Project too large (max 500KB)" }, { status: 413 });
  }

  // slug derived from UUID prefix — stable, unique, no collision with published slugs
  const slug = `wsp-${id.slice(0, 8)}`;
  const safeName = name.trim();

  const { error } = await supabase.from("projects").upsert(
    {
      id,
      user_id: session.user.id,
      name: safeName,
      slug,
      prompt: safeName,
      description: "Workspace project",
      files: files ?? {},
      updated_at: updatedAt ?? new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
