import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, model = "dall-e-3", size = "1024x1024", quality = "standard", style = "vivid", n = 1 } = await req.json();
  if (!prompt) return NextResponse.json({ error: "프롬프트가 필요합니다" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY 미설정" }, { status: 500 });

  const body: Record<string, unknown> = { prompt, model, size, n };
  if (model === "dall-e-3") {
    body.quality = quality;
    body.style   = style;
  }

  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const err = await r.json();
    return NextResponse.json({ error: err.error?.message ?? "이미지 생성 실패" }, { status: r.status });
  }

  const data = await r.json();
  return NextResponse.json({ images: data.data ?? [] });
}
