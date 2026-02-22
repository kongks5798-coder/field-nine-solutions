/**
 * POST /api/admin/db-migrate
 * ADMIN_SECRET 인증 후 Supabase 스키마 마이그레이션 실행
 * SUPABASE_DATABASE_URL 이 설정되어 있으면 자동 실행
 * 설정 안 됐으면 migration 상태 + 필요한 SQL 반환
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { runMigrations } from "@/lib/migrate";

// postgres 패키지는 Node.js 런타임만 지원
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const hasDbUrl = !!process.env.SUPABASE_DATABASE_URL;

  if (!hasDbUrl) {
    return NextResponse.json({
      ok: false,
      message: "SUPABASE_DATABASE_URL 미설정",
      hint: "Vercel 대시보드 → Settings → Environment Variables → SUPABASE_DATABASE_URL 추가",
      format: "postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres",
      projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1],
      dashboardUrl: "https://app.supabase.com/project/_/settings/database",
    });
  }

  const results = await runMigrations();
  const allOk = results.every((r) => r.status === "ok" || r.status === "skip");

  return NextResponse.json({
    ok: allOk,
    results,
    summary: {
      total:   results.length,
      ok:      results.filter((r) => r.status === "ok").length,
      skipped: results.filter((r) => r.status === "skip").length,
      errors:  results.filter((r) => r.status === "error").length,
    },
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const dbUrl  = process.env.SUPABASE_DATABASE_URL;
  const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ref    = supUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  // 마이그레이션 필요 여부 빠른 체크 (서비스롤 REST)
  const statuses = await Promise.all([
    fetch(`${supUrl}/rest/v1/cowork_docs?limit=0`, {
      headers: {
        apikey:        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }).then((r) => ({ id: "098", label: "cowork_docs", applied: r.status === 200 })).catch(() => ({ id: "098", label: "cowork_docs", applied: false })),
    fetch(`${supUrl}/rest/v1/profiles?select=trial_ends_at&limit=1`, {
      headers: {
        apikey:        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }).then(async (r) => {
      const txt = await r.text();
      return { id: "099", label: "profiles trial columns", applied: !txt.includes("42703") };
    }).catch(() => ({ id: "099", label: "profiles trial columns", applied: false })),
  ]);

  return NextResponse.json({
    dbUrlConfigured: !!dbUrl,
    projectRef: ref,
    migrations: statuses,
    allApplied: statuses.every((s) => s.applied),
    hint: !dbUrl ? `Supabase 대시보드에서 DB 비밀번호를 확인하고 SUPABASE_DATABASE_URL을 설정하세요.\n형식: postgresql://postgres.${ref ?? "[REF]"}:[PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres` : undefined,
  });
}
