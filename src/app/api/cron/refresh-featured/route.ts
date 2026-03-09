/**
 * GET /api/cron/refresh-featured
 * Vercel Cron: 매일 00:00 UTC (09:00 KST)
 * "오늘의 딸깍" 피처드 캐시를 revalidate
 * → /api/showcase/featured의 5분 캐시를 강제 갱신
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
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
