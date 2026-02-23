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

// GET /api/cowork/docs — 유저 문서 목록
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const uid = session.user.id;

  const { searchParams } = req.nextUrl;
  const shared = searchParams.get("shared") === "1";

  let query = admin.from("cowork_docs").select("id, title, emoji, is_shared, created_at, updated_at");

  if (shared) {
    query = query.eq("is_shared", true);
  } else {
    query = query.eq("user_id", uid);
  }

  const { data, error } = await query.order("updated_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ docs: data ?? [] });
}

const CreateSchema = z.object({
  title:     z.string().min(1).max(200).default("새 문서"),
  emoji:     z.string().max(10).default("📄"),
  content:   z.string().max(500_000).default(""),
  is_shared: z.boolean().default(false),
});

// POST /api/cowork/docs — 새 문서 생성
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = serverClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("cowork_docs")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select("id, title, emoji, is_shared, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doc: data }, { status: 201 });
}
