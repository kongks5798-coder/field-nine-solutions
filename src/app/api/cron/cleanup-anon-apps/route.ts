/**
 * GET /api/cron/cleanup-anon-apps
 * Vercel Cron: 매일 02:00 UTC
 * 30일 이상 된 익명(user_id IS NULL) 배포 앱 자동 삭제
 * → Supabase 스토리지 절약 + 쇼케이스 품질 유지
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  // Vercel cron 인증 (프로덕션에서만 검증)
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = serviceClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("published_apps")
    .delete()
    .is("user_id", null)                   // 익명 앱만
    .lt("created_at", cutoff)              // 30일 초과
    .select("slug");

  if (error) {
    console.error("[cron/cleanup-anon-apps]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const deleted = data?.length ?? 0;
  console.log(`[cron/cleanup-anon-apps] Deleted ${deleted} anon apps older than 30 days`);

  return NextResponse.json({
    ok: true,
    deleted,
    cutoff,
    timestamp: new Date().toISOString(),
  });
}
