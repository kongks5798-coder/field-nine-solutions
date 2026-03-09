/**
 * POST /api/quality/scores — save a quality score after generation
 * GET  /api/quality/scores?limit=20 — fetch user's score history
 *
 * Table DDL:
 * CREATE TABLE IF NOT EXISTS quality_scores (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   app_name text NOT NULL DEFAULT '새 앱',
 *   score integer NOT NULL CHECK(score >= 0 AND score <= 100),
 *   issues_count integer NOT NULL DEFAULT 0,
 *   pipeline_type text NOT NULL DEFAULT 'team',
 *   platform text,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX ON quality_scores(user_id, created_at DESC);
 * ALTER TABLE quality_scores ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "users own scores" ON quality_scores FOR ALL USING (auth.uid() = user_id);
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { checkLimit, ipFromHeaders, headersFor } from "@/core/rateLimit";
import { getAdminClient } from "@/lib/supabase-admin";
import { log } from "@/lib/logger";

const PostBodySchema = z.object({
  appName: z.string().min(1).max(200).default("새 앱"),
  score: z.number().int().min(0).max(100),
  issuesCount: z.number().int().min(0).default(0),
  platform: z.string().max(100).optional(),
  pipelineType: z.enum(["team", "legacy"]).default("team"),
});

function getSession(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  return supabase.auth.getSession();
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit: 30/min per IP
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`quality-scores-post:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: headersFor(rl) }
    );
  }

  // Auth check
  const { data: { session } } = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse + validate body
  let body: z.infer<typeof PostBodySchema>;
  try {
    const raw = await req.json();
    body = PostBodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Write via service role (bypasses RLS insert issue, policy covers reads)
  try {
    const admin = getAdminClient();
    const { error } = await admin.from("quality_scores").insert({
      user_id: session.user.id,
      app_name: body.appName,
      score: body.score,
      issues_count: body.issuesCount,
      pipeline_type: body.pipelineType,
      platform: body.platform ?? null,
    });
    if (error) {
      log.error("[quality/scores POST] DB insert error", { error: error.message });
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    log.error("[quality/scores POST] unexpected error", { err: (err as Error).message });
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Rate limit: 30/min per IP
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`quality-scores-get:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMIT", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: headersFor(rl) }
    );
  }

  // Auth check
  const { data: { session } } = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("quality_scores")
      .select("id, app_name, score, issues_count, pipeline_type, platform, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("[quality/scores GET] DB query error", { error: error.message });
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ scores: data ?? [] });
  } catch (err) {
    log.error("[quality/scores GET] unexpected error", { err: (err as Error).message });
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
