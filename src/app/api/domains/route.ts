import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// GET /api/domains — list user's domains
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ domains: [] });

  const { data, error } = await supabase
    .from("domains")
    .select("id, domain, project_id, project_name, status, cname_value, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domains: data ?? [] });
}

// POST /api/domains — add domain
// Body: { domain, projectId?, projectName? }
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawDomain: string = (body.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const projectId: string = body.projectId ?? "";
  const projectName: string = (body.projectName ?? "내 앱").slice(0, 80);

  // Basic validation
  if (!rawDomain || !rawDomain.includes(".") || rawDomain.length > 253) {
    return NextResponse.json({ error: "올바른 도메인을 입력해주세요." }, { status: 400 });
  }

  // Per-user limit: max 10 domains
  const { count } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "도메인은 최대 10개까지 등록할 수 있습니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("domains")
    .insert({
      user_id: session.user.id,
      domain: rawDomain,
      project_id: projectId || null,
      project_name: projectName,
      status: "pending",
      cname_value: "cname.fieldnine.io",
    })
    .select()
    .single();

  if (error) {
    // Unique violation
    if (error.code === "23505") {
      return NextResponse.json({ error: "이미 등록된 도메인입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data });
}
