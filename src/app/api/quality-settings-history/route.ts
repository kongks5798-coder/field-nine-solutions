import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** GET /api/quality-settings-history — 설정 변경 이력 조회 (stub) */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 DB에서 설정 변경 이력 조회
  return NextResponse.json({ logs: [], total: 0 });
}

/** POST /api/quality-settings-history — 설정 변경 이력 기록 (stub) */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 변경 이력 저장 로직
  return NextResponse.json({ message: "이력 저장 기능 준비 중입니다." });
}
