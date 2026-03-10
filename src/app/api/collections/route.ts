import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous"
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  name:        z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public:   z.boolean().optional().default(true),
});

// ── GET /api/collections — list authenticated user's collections ───────────────

export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch collections with app count via aggregation
  const { data, error } = await supabase
    .from("collections")
    .select(
      `id, name, description, is_public, created_at,
       collection_apps(count)`
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "컬렉션을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  // Normalise the nested count shape Supabase returns
  const collections = (data ?? []).map((c) => ({
    id:          c.id,
    name:        c.name,
    description: c.description ?? null,
    is_public:   c.is_public,
    created_at:  c.created_at,
    app_count:
      Array.isArray(c.collection_apps)
        ? (c.collection_apps[0] as { count: number } | undefined)?.count ?? 0
        : 0,
  }));

  return NextResponse.json({ collections });
}

// ── POST /api/collections — create a new collection ──────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit: 10 creates per minute per IP
  const ip = getIp(req);
  const rl = checkRateLimit(`collections:create:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." },
      { status: 429 }
    );
  }

  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "잘못된 입력입니다.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, description, is_public } = parsed.data;

  const { data, error } = await supabase
    .from("collections")
    .insert({ user_id: session.user.id, name, description, is_public })
    .select("id, name, description, is_public, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "컬렉션 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ collection: data }, { status: 201 });
}

// ── DELETE /api/collections?id=<uuid> — delete a collection ──────────────────

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS enforces ownership; we also filter explicitly for clarity
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json(
      { error: "컬렉션 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
