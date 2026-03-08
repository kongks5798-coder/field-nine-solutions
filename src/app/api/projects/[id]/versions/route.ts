import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

type Params = { params: Promise<{ id: string }> };

// GET — list snapshots for a project
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: versions } = await supabase
      .from("project_versions")
      .select("id, label, created_at, file_count, size_bytes")
      .eq("project_id", id)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({ versions: versions ?? [] });
  } catch {
    return NextResponse.json({ versions: [] });
  }
}

// POST — create a new snapshot
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { files?: unknown; label?: string };
  const { files, label } = body;
  if (!files) return NextResponse.json({ error: "files required" }, { status: 400 });

  const filesJson = JSON.stringify(files);
  const sizeBytes = new TextEncoder().encode(filesJson).length;
  const fileCount = Object.keys(files as Record<string, unknown>).length;

  try {
    const { data: version, error } = await supabase
      .from("project_versions")
      .insert({
        project_id: id,
        user_id: session.user.id,
        files,
        label: label ?? `스냅샷 ${new Date().toLocaleString("ko-KR")}`,
        file_count: fileCount,
        size_bytes: sizeBytes,
      })
      .select("id, label, created_at")
      .single();

    if (error) throw error;

    // Keep max 20 versions per project
    const { data: allVersions } = await supabase
      .from("project_versions")
      .select("id")
      .eq("project_id", id)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (allVersions && allVersions.length > 20) {
      const toDelete = allVersions.slice(20).map((v: { id: string }) => v.id);
      await supabase.from("project_versions").delete().in("id", toDelete);
    }

    return NextResponse.json({ version });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
