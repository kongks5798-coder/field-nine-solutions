import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

const DEFAULT_SETTINGS = {
  autoEval: false,
  threshold: 0.7,
  model: "gpt-4o-mini",
  notifyThreshold: 50,
  alertInterval: 10,
};

/** GET /api/quality-settings — 품질 설정 조회 (stub) */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 DB에서 설정 조회
  return NextResponse.json({
    settings: DEFAULT_SETTINGS,
    ...DEFAULT_SETTINGS,
  });
}

/** POST /api/quality-settings — 품질 설정 저장 (stub) */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 설정 저장 로직
  return NextResponse.json({ message: "설정 저장 기능 준비 중입니다." });
}

/** PUT /api/quality-settings — 품질 설정 업데이트 (stub) */
export async function PUT(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 설정 업데이트 로직
  return NextResponse.json({ message: "설정 저장 기능 준비 중입니다." });
}
