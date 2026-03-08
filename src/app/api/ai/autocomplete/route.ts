import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = checkRateLimit(`ai:autocomplete:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { code, language, cursorLine, prefix } = await req.json();

    if (!prefix || prefix.trim().length < 3) {
      return NextResponse.json({ suggestion: "" });
    }

    const systemPrompt = `You are an expert ${language} code completion assistant. Complete the code naturally and concisely.
Rules:
- Output ONLY the completion text (what comes after the cursor), nothing else
- Max 5 lines
- No explanations, no markdown, no code blocks
- If unsure, return empty string`;

    const userPrompt = `Complete this ${language} code at the cursor position (|):
\`\`\`${language}
${code.slice(-500)}|
\`\`\`
Current line: ${cursorLine}
Return ONLY the completion text.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ suggestion: "" });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 150,
        temperature: 0.2,
        stop: ["\n\n\n"],
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return NextResponse.json({ suggestion: "" });
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const suggestion = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ suggestion: "" });
  }
}
