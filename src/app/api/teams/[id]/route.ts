import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase.from("teams").select("*").eq("id", id).single();
  if (!team) return NextResponse.json({ error: "팀을 찾을 수 없습니다" }, { status: 404 });
  return NextResponse.json({ team });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: team } = await supabase.from("teams").select("owner_id").eq("id", id).single();
  if (team?.owner_id !== user.id) return NextResponse.json({ error: "소유자만 삭제 가능합니다" }, { status: 403 });

  await supabase.from("teams").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
