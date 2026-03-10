import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Helpers ──────────────────────────────────────────────────────────────────

function anonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

function serverClientFromReq(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const SubmitSchema = z.object({
  label: z.string().min(3).max(80),
  description: z.string().max(200).optional(),
  language: z.enum(["html", "css", "javascript", "typescript"]),
  category: z.string().min(1).max(50),
  code: z.string().min(10).max(5000),
});

// ── GET /api/snippets ─────────────────────────────────────────────────────────
// Public — no auth required. Cached 5 minutes via Cache-Control.
// Query params: ?category=CSS&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const supabase = anonClient();

  let query = supabase
    .from("community_snippets")
    .select("id, label, description, language, category, code, likes, created_at")
    .eq("is_approved", true)
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 });
  }

  return NextResponse.json(
    { snippets: data ?? [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}

// ── POST /api/snippets ────────────────────────────────────────────────────────
// Auth required. Rate limit: 3/hour per user.
export async function POST(req: NextRequest) {
  // Auth check
  const supabase = serverClientFromReq(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 3 submissions per hour per user
  const rlKey = `snippet_submit:${session.user.id}`;
  const rl = checkRateLimit(rlKey, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "제출 한도 초과 (1시간에 3개까지)" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  // Body validation
  const parsed = SubmitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { label, description, language, category, code } = parsed.data;

  const { data, error } = await supabase.from("community_snippets").insert({
    user_id: session.user.id,
    label,
    description: description ?? null,
    language,
    category,
    code,
    is_approved: false,
  }).select("id").single();

  if (error) {
    return NextResponse.json({ error: "Failed to submit snippet" }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.id, message: "스니펫이 제출되었습니다. 검토 후 공개됩니다." },
    { status: 201 }
  );
}
