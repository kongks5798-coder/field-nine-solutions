import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// GET /api/published/[slug]/comments — fetch comments for a published app
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = serviceClient();

  try {
    const { data: comments } = await supabase
      .from("app_comments")
      .select("id, content, created_at, user_id, profiles(full_name, avatar_url)")
      .eq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ comments: comments ?? [] });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

// POST /api/published/[slug]/comments — post a new comment
export async function POST(req: NextRequest, { params }: Params) {
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

  const { content } = await req.json();
  if (!content || content.trim().length < 2) {
    return NextResponse.json({ error: "댓글을 입력해주세요" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json(
      { error: "댓글은 500자 이내로 작성해주세요" },
      { status: 400 }
    );
  }

  const supabase = serviceClient();

  try {
    const { data: comment, error } = await supabase
      .from("app_comments")
      .insert({ slug, user_id: user.id, content: content.trim() })
      .select("id, content, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "댓글 작성 실패" }, { status: 500 });
  }
}
