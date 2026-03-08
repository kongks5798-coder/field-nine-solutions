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

  try {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id, role, joined_at, profiles(email, full_name, avatar_url)")
      .eq("team_id", id);
    return NextResponse.json({ members: members ?? [] });
  } catch {
    return NextResponse.json({ members: [] });
  }
}

// POST — invite member by email
export async function POST(req: NextRequest, { params }: Params) {
  const { id: teamId } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role = "editor" } = await req.json();
  if (!email) return NextResponse.json({ error: "이메일을 입력해주세요" }, { status: 400 });

  // Check if inviter is owner/admin
  try {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // Insert invite
    await supabase.from("team_invites").insert({
      team_id: teamId, email, role, invited_by: user.id,
    });

    return NextResponse.json({ ok: true, message: `${email}에게 초대를 보냈습니다` });
  } catch (e) {
    console.error("[team members] invite error:", e);
    return NextResponse.json({ error: "초대 실패 — DB 테이블 설정 필요" }, { status: 500 });
  }
}
