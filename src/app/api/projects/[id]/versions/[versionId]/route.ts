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

type Params = { params: Promise<{ id: string; versionId: string }> };

// GET — fetch a specific version's files (for restore)
export async function GET(req: NextRequest, { params }: Params) {
  const { id, versionId } = await params;
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: version } = await supabase
    .from("project_versions")
    .select("files, label, created_at")
    .eq("id", versionId)
    .eq("project_id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!version) return NextResponse.json({ error: "버전을 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json({ version });
}

// DELETE — remove a specific version
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, versionId } = await params;
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("project_versions")
    .delete()
    .eq("id", versionId)
    .eq("project_id", id)
    .eq("user_id", session.user.id);

  return NextResponse.json({ ok: true });
}
