import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { admin } from "@/utils/supabase/admin";

/** GET /api/admin-alert-log — 관리자 알림 이력 조회 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");
    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
    const severity = req.nextUrl.searchParams.get("severity");
    const type = req.nextUrl.searchParams.get("type");

    let query = admin
      .from("admin_alert_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq("severity", severity);
    }
    if (type) {
      query = query.eq("type", type);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0 });
  } catch {
    // Graceful degradation: table may not exist yet
    return NextResponse.json({ logs: [], total: 0 });
  }
}
