import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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

// GET /api/teams — list user's teams
export async function GET() {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Graceful: return empty if table doesn't exist yet
  try {
    const { data: memberships } = await supabase
      .from("team_members")
      .select("team_id, role, teams(id, name, plan, created_at, owner_id)")
      .eq("user_id", user.id);
    return NextResponse.json({ teams: memberships ?? [] });
  } catch {
    return NextResponse.json({ teams: [] });
  }
}

// POST /api/teams — create a new team
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name || name.length > 50) {
    return NextResponse.json({ error: "팀 이름을 입력해주세요 (최대 50자)" }, { status: 400 });
  }

  try {
    const { data: team, error } = await supabase
      .from("teams")
      .insert({ name, owner_id: user.id, plan: "team" })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner member
    await supabase.from("team_members").insert({
      team_id: team.id, user_id: user.id, role: "owner",
    });

    return NextResponse.json({ team });
  } catch (e) {
    console.error("[teams] create error:", e);
    return NextResponse.json({ error: "팀 생성 실패" }, { status: 500 });
  }
}
