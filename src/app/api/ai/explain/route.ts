import { NextRequest, NextResponse } from "next/server";

// Rate limit: 10/min per IP
const ipMap = new Map<string, { count: number; reset: number }>();
function checkLimit(ip: string): boolean {
  const now = Date.now();
  const e = ipMap.get(ip);
  if (!e || now > e.reset) { ipMap.set(ip, { count: 1, reset: now + 60_000 }); return false; }
  if (e.count >= 10) return true;
  e.count++; return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (checkLimit(ip)) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const { html = "", css = "", js = "", appName = "이 앱" } = await req.json().catch(() => ({}));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const codePreview = [
    html ? `[HTML - ${html.length}자]\n${html.slice(0, 1500)}` : "",
    css  ? `[CSS  - ${css.length}자]\n${css.slice(0, 1000)}` : "",
    js   ? `[JS   - ${js.length}자]\n${js.slice(0, 1500)}` : "",
  ].filter(Boolean).join("\n\n");

  const systemPrompt = `당신은 친절한 코드 설명 선생님입니다. 초보자도 이해할 수 있게 한국어로 간결하게 설명하세요.
형식:
## 이 앱은 뭐해요?
(1-2줄 요약)

## 어떻게 만들었어요?
(HTML/CSS/JS 역할 각 1줄)

## 핵심 기능
(불릿 3-5개, 이모지 포함)

## 수정하고 싶다면
(1-2가지 쉬운 수정 포인트)`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "messages-2023-12-15",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      stream: true,
      system: systemPrompt,
      messages: [{ role: "user", content: `"${appName}" 앱의 코드를 설명해줘:\n\n${codePreview}` }],
    }),
  });

  if (!anthropicRes.ok || !anthropicRes.body) {
    const err = await anthropicRes.text().catch(() => "unknown error");
    return NextResponse.json({ error: err }, { status: anthropicRes.status });
  }

  const encoder = new TextEncoder();
  const upstream = anthropicRes.body.getReader();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buf = "";
      try {
        while (true) {
          const { done, value } = await upstream.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`));
              }
            } catch { /* skip malformed */ }
          }
        }
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
