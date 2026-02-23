import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/utils/supabase/admin";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** GET /api/get-chat-logs — 채팅 로그 조회 */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");
    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");

    const { data: logs, error, count } = await admin
      .from("chat_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0 });
  } catch {
    // Graceful degradation: table may not exist yet
    return NextResponse.json({ logs: [], total: 0 });
  }
}
