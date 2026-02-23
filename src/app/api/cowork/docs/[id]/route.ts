import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-admin";
import { z } from "zod";

function serverClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

async function getSession() {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  return supabase.auth.getSession();
}

// GET /api/cowork/docs/[id] — 문서 내용 조회
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { session } } = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("cowork_docs")
    .select("*")
    .eq("id", id)
    .or(`user_id.eq.${session.user.id},is_shared.eq.true`)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ doc: data });
}

const UpdateSchema = z.object({
  title:     z.string().min(1).max(200).optional(),
  emoji:     z.string().max(10).optional(),
  content:   z.string().max(500_000).optional(),
  is_shared: z.boolean().optional(),
}).strict();

// PATCH /api/cowork/docs/[id] — 문서 저장
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { session } } = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const admin = getAdminClient();

  // 본인 문서만 수정 가능
  const { data, error } = await admin
    .from("cowork_docs")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id, title, emoji, is_shared, updated_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  return NextResponse.json({ doc: data });
}

// DELETE /api/cowork/docs/[id] — 문서 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { session } } = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const { error } = await admin
    .from("cowork_docs")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
