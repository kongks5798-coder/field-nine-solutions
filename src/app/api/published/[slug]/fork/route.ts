import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// POST /api/published/[slug]/fork — fork a published app into the user's workspace
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Authenticate user
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const supabase = serviceClient();

  // Get original app
  const { data: app } = await supabase
    .from("published_apps")
    .select("name, html, user_id")
    .eq("slug", slug)
    .single();

  if (!app) {
    return NextResponse.json({ error: "앱을 찾을 수 없습니다" }, { status: 404 });
  }

  // Create forked project
  const forkName = `${app.name} (포크)`;
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: forkName,
      files: {
        "index.html": {
          name: "index.html",
          content: app.html,
          language: "html",
        },
      },
      forked_from: slug,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "포크 실패" }, { status: 500 });
  }

  // Increment fork count (best-effort, ignore errors)
  supabase.rpc("increment_forks", { slug_param: slug }).then(() => {});

  return NextResponse.json({
    projectId: project.id,
    redirect: `/workspace?project=${project.id}`,
  });
}
