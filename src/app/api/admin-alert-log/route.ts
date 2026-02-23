import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";

/** GET /api/admin-alert-log — 관리자 알림 이력 조회 (stub) */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // TODO: 실제 DB에서 관리자 알림 로그 조회
  return NextResponse.json({ logs: [], total: 0 });
}
