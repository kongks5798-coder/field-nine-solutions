import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function makeServerClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// GET /api/history?limit=20
export async function GET(req: NextRequest) {
  const sb = makeServerClient(req);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") ?? "20"));

  const { data, error } = await sb
    .from("generation_history")
    .select("id, prompt, app_name, model_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data });
}

// POST /api/history — save a generation
export async function POST(req: NextRequest) {
  const body = await req.json() as { prompt: string; app_name?: string; model_id?: string };
  if (!body.prompt?.trim()) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const sb = makeServerClient(req);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Keep max 50 entries per user — delete oldest if over limit
  const { count } = await sb
    .from("generation_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= 50) {
    const { data: oldest } = await sb
      .from("generation_history")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (oldest?.[0]) {
      await sb.from("generation_history").delete().eq("id", oldest[0].id);
    }
  }

  const { error } = await sb.from("generation_history").insert({
    user_id: user.id,
    prompt: body.prompt.trim(),
    app_name: body.app_name,
    model_id: body.model_id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/history?id=UUID
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = makeServerClient(req);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await sb.from("generation_history").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
