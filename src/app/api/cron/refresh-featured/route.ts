/**
 * GET /api/cron/refresh-featured
 * Vercel Cron: 매일 00:00 UTC (09:00 KST)
 * "오늘의 딸깍" 피처드 캐시를 revalidate
 * → /api/showcase/featured의 5분 캐시를 강제 갱신
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  // CRON_SECRET 검증 — 미설정 시 503 반환 (인증 우회 방지)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revalidate the featured API route cache
  revalidatePath("/api/showcase/featured");
  revalidatePath("/");  // Homepage also uses featured data

  console.log("[cron/refresh-featured] Revalidated featured cache");

  return NextResponse.json({
    ok: true,
    revalidated: ["/api/showcase/featured", "/"],
    timestamp: new Date().toISOString(),
  });
}
