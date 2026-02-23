import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** GET /api/quality-backup?file=<key> — 품질 데이터 백업 다운로드 (stub) */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = req.nextUrl.searchParams.get("file") ?? "";
  const validKeys = [
    "chat-log",
    "admin-alert-log",
    "quality-settings-history",
    "quality-settings",
  ];

  if (!validKeys.includes(file)) {
    return NextResponse.json(
      { error: "유효하지 않은 파일 키입니다." },
      { status: 400 },
    );
  }

  // TODO: 실제 백업 데이터 조회 후 파일 생성
  const isJson = file === "quality-settings";
  const content = isJson ? "{}" : "";
  const ext = isJson ? ".json" : ".jsonl";

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": isJson
        ? "application/json"
        : "application/x-ndjson",
      "Content-Disposition": `attachment; filename="${file}${ext}"`,
    },
  });
}

/** POST /api/quality-backup — 백업 생성 (stub) */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: 실제 백업 생성 로직
  return NextResponse.json({ message: "백업 기능 준비 중입니다." });
}
