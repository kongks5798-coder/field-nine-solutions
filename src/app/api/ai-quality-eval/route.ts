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

/** POST /api/ai-quality-eval — AI 응답 품질 평가 */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { prompt, response, expected, model } = body as {
    prompt?: string;
    response?: string;
    expected?: string;
    model?: string;
  };

  try {
    // Simple similarity-based scoring (length ratio + keyword overlap)
    const promptText = prompt ?? "";
    const responseText = response ?? "";
    const expectedText = expected ?? "";

    let score = 0;
    let feedback = "";
    const metrics: Record<string, number> = {};

    if (expectedText && responseText) {
      // Basic keyword overlap scoring
      const expectedWords = new Set(expectedText.toLowerCase().split(/\s+/));
      const responseWords = new Set(responseText.toLowerCase().split(/\s+/));
      let overlap = 0;
      for (const w of expectedWords) {
        if (responseWords.has(w)) overlap++;
      }
      score = expectedWords.size > 0 ? Math.round((overlap / expectedWords.size) * 100) : 0;
      metrics.keywordOverlap = overlap;
      metrics.expectedKeywords = expectedWords.size;
      metrics.responseLength = responseText.length;
      feedback = score >= 70 ? "응답 품질이 양호합니다." : "응답 품질 개선이 필요합니다.";
    } else if (responseText) {
      score = responseText.length > 10 ? 50 : 20;
      metrics.responseLength = responseText.length;
      feedback = "기대 응답이 없어 기본 점수를 부여했습니다.";
    } else {
      feedback = "응답이 비어 있습니다.";
    }

    // Store evaluation result
    const { error: insertError } = await admin
      .from("ai_quality_evals")
      .insert({
        model: model ?? "gpt-4o-mini",
        score,
        prompt: promptText,
        response: responseText,
        expected: expectedText,
        feedback,
        metrics,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      score,
      feedback,
      prompt: promptText,
      response: responseText,
      expected: expectedText,
      metrics,
    });
  } catch {
    // Graceful degradation
    return NextResponse.json({
      score: 0,
      feedback: "평가 저장 중 오류가 발생했습니다.",
      prompt: prompt ?? "",
      response: response ?? "",
      expected: expected ?? "",
      metrics: {},
    });
  }
}
