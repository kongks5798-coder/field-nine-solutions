import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`ai:readme:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { files, projectName } = await req.json();

    const html = (files as Record<string, { content: string }>)?.["index.html"]?.content ?? "";
    const js = (files as Record<string, { content: string }>)?.["script.js"]?.content ?? "";

    if (html.length < 100) return NextResponse.json({ readme: "" });

    const prompt = `다음 웹앱 코드를 분석하여 한국어로 README.md를 작성해주세요.

프로젝트명: ${projectName}

HTML (일부):
${html.slice(0, 2000)}

JavaScript (일부):
${js.slice(0, 1000)}

README 형식:
# ${projectName}

## 소개
[2-3문장 설명]

## 주요 기능
- [기능 1]
- [기능 2]
- [기능 3]

## 사용 방법
[간단한 사용법]

## 기술 스택
- HTML5
- CSS3
- JavaScript

---
*✨ Dalkak AI로 생성됨*

마크다운 형식으로만 출력하세요.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ readme: "" });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return NextResponse.json({ readme: "" });
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const readme = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ readme });
  } catch (e) {
    return NextResponse.json({ readme: "", error: (e as Error).message });
  }
}
