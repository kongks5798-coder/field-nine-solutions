import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await userClient.auth.getUser();
  return user;
}

const PostBody = z.object({
  content: z
    .string()
    .min(1, "댓글을 입력해주세요")
    .max(500, "댓글은 500자 이내로 작성해주세요"),
});

// GET /api/published/[slug]/comments — fetch comments (public, newest first, max 50)
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const supabase = serviceClient();

  try {
    const { data: comments } = await supabase
      .from("app_comments")
      .select(
        "id, content, created_at, user_id, profiles(full_name, avatar_url)"
      )
      .eq("app_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ comments: comments ?? [] });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

// POST /api/published/[slug]/comments — add a comment (auth required, 5/min rate limit)
export async function POST(req: NextRequest, { params }: Params) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { slug } = await params;

  // Rate limit: 5 comments per IP per minute
  const rl = checkRateLimit(`comment:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "너무 많은 댓글을 작성했습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const parsed = PostBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청입니다" },
      { status: 400 }
    );
  }

  const supabase = serviceClient();

  try {
    const { data: comment, error } = await supabase
      .from("app_comments")
      .insert({
        app_slug: slug,
        user_id: user.id,
        content: parsed.data.content.trim(),
      })
      .select("id, content, created_at, user_id")
      .single();

    if (error) throw error;
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/published/[slug]/comments?id=commentId — delete own comment
export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const commentId = req.nextUrl.searchParams.get("id");

  if (!commentId) {
    return NextResponse.json(
      { error: "댓글 ID가 필요합니다" },
      { status: 400 }
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }

  const supabase = serviceClient();

  try {
    const { error } = await supabase
      .from("app_comments")
      .delete()
      .eq("id", commentId)
      .eq("app_slug", slug)
      .eq("user_id", user.id); // only owner can delete

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "댓글 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
