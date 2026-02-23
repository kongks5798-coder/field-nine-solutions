import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** POST /api/ai-quality-eval — AI 응답 품질 평가 (stub) */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { prompt, response, expected } = body as {
    prompt?: string;
    response?: string;
    expected?: string;
  };

  // TODO: 실제 AI 품질 평가 로직 연동
  return NextResponse.json({
    score: 0,
    feedback: "평가 기능 준비 중입니다.",
    prompt: prompt ?? "",
    response: response ?? "",
    expected: expected ?? "",
    metrics: {},
  });
}
