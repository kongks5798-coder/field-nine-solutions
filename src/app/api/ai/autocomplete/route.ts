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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ suggestion: "" });
  }

  // --- Prompt autocomplete mode: { partial, context? } ---
  if (typeof body.partial === "string") {
    const partial = body.partial.trim();
    if (partial.length < 3) return NextResponse.json({ suggestion: "" });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ suggestion: "" });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 30,
          system:
            "You complete Korean app development prompts. Complete the given prompt naturally in 5-15 Korean words. Return ONLY the completion text, no quotes, no explanation. If unclear, return empty string.",
          messages: [
            { role: "user", content: `Complete this prompt: "${partial}"` },
          ],
        }),
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return NextResponse.json({ suggestion: "" });
      const data = await res.json() as { content: Array<{ type: string; text: string }> };
      const raw = data.content?.[0]?.text?.trim() ?? "";
      const suggestion = raw.replace(/^["'\s]+|["'\s]+$/g, "").slice(0, 60);
      return NextResponse.json({ suggestion });
    } catch {
      return NextResponse.json({ suggestion: "" });
    }
  }

  // --- Code editor autocomplete mode: { prefix, code, language, cursorLine } ---
  const { code, language, cursorLine, prefix } = body as {
    code?: string;
    language?: string;
    cursorLine?: string;
    prefix?: string;
  };

  if (!prefix || String(prefix).trim().length < 3) {
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
${String(code ?? "").slice(-500)}|
\`\`\`
Current line: ${cursorLine}
Return ONLY the completion text.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ suggestion: "" });

  try {
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
