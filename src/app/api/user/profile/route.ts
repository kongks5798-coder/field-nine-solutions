import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function makeSupabase(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

export async function GET(req: NextRequest) {
  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, website, plan, created_at")
    .eq("id", user.id)
    .single();

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: publishedCount } = await supabase
    .from("published_apps")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, ...profile },
    stats: { projects: projectCount ?? 0, published: publishedCount ?? 0 },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = makeSupabase(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const allowed = ["full_name", "bio", "website", "avatar_url"];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = String(body[key]).slice(0, 200);
  }

  // Handle username separately — validate format and uniqueness
  if (body["username"] !== undefined) {
    const raw = String(body["username"]).toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(raw)) {
      return NextResponse.json(
        { error: "사용자명은 영문 소문자·숫자·밑줄(_)만 3~20자로 입력해주세요." },
        { status: 400 }
      );
    }
    // Check uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", raw)
      .neq("id", user.id)
      .single();
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 사용자명입니다." }, { status: 409 });
    }
    updates["username"] = raw;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
