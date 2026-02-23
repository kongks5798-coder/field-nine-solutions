import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { log } from "@/lib/logger";

export const maxDuration = 60;

const MessageSchema = z.object({ role: z.string(), content: z.string() });

const GenerateSchema = z.object({
  model:    z.string().min(1),
  prompt:   z.string().max(10000).optional(),
  provider: z.enum(["openai", "anthropic", "gemini", "ollama", "grok"]),
  system:   z.string().max(5000).optional(),
  messages: z.array(MessageSchema).optional(),
});

type Msg = { role: string; content: string };

export async function POST(req: NextRequest) {
  // ── 인증 확인 ────────────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });
  const { model, prompt, provider, system, messages = [] } = parsed.data;

  if (!prompt && messages.length === 0) {
    return new Response("프롬프트가 필요합니다", { status: 400 });
  }

  const encoder = new TextEncoder();

  function sse(ctrl: ReadableStreamDefaultController, text: string) {
    ctrl.enqueue(encoder.encode("data: " + JSON.stringify({ text }) + "\n\n"));
  }

  const baseMessages: Msg[] = messages.length > 0 ? messages : [{ role: "user", content: prompt ?? "" }];
  const withSystem = system ? [{ role: "system", content: system }, ...baseMessages] : baseMessages;

  const readable = new ReadableStream({
    async start(ctrl) {
      try {
        // ── Ollama (local) ──────────────────────────────────────────────────
        if (provider === "ollama") {
          const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
          const r = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model, messages: withSystem, stream: true }),
          });
          if (!r.ok) { sse(ctrl, `[오류] Ollama ${r.status}`); ctrl.close(); return; }
          const reader = r.body?.getReader();
          if (!reader) { ctrl.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n").filter(Boolean)) {
              try { const j = JSON.parse(line); if (j.message?.content) sse(ctrl, j.message.content); } catch {}
            }
          }

        // ── OpenAI ──────────────────────────────────────────────────────────
        } else if (provider === "openai") {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) { sse(ctrl, "[오류] OPENAI_API_KEY 미설정"); ctrl.close(); return; }
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ model, stream: true, max_tokens: 8192, messages: withSystem }),
          });
          if (!r.ok) { sse(ctrl, `[오류] OpenAI ${r.status}`); ctrl.close(); return; }
          const reader = r.body?.getReader();
          if (!reader) { ctrl.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try { const t = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (t) sse(ctrl, t); } catch {}
              }
            }
          }

        // ── Anthropic ───────────────────────────────────────────────────────
        } else if (provider === "anthropic") {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) { sse(ctrl, "[오류] ANTHROPIC_API_KEY 미설정"); ctrl.close(); return; }
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({
              model, max_tokens: 8192, stream: true,
              ...(system ? { system } : {}),
              messages: baseMessages,
            }),
          });
          if (!r.ok) { sse(ctrl, `[오류] Anthropic ${r.status}`); ctrl.close(); return; }
          const reader = r.body?.getReader();
          if (!reader) { ctrl.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n")) {
              if (line.startsWith("data: ")) {
                try { const j = JSON.parse(line.slice(6)); if (j.type === "content_block_delta") sse(ctrl, j.delta?.text ?? ""); } catch {}
              }
            }
          }

        // ── Grok ───────────────────────────────────────────────────────────
        } else if (provider === "grok") {
          const apiKey = process.env.XAI_API_KEY;
          if (!apiKey) { sse(ctrl, "[오류] XAI_API_KEY 미설정"); ctrl.close(); return; }
          const r = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: model || "grok-3", stream: true, max_tokens: 8192, messages: withSystem }),
          });
          if (!r.ok) { sse(ctrl, `[오류] Grok ${r.status}`); ctrl.close(); return; }
          const reader = r.body?.getReader();
          if (!reader) { ctrl.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try { const t = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (t) sse(ctrl, t); } catch {}
              }
            }
          }

        // ── Gemini ──────────────────────────────────────────────────────────
        } else if (provider === "gemini") {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
          if (!apiKey) { sse(ctrl, "[오류] GEMINI_API_KEY 미설정"); ctrl.close(); return; }
          const geminiContents = baseMessages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }));
          const geminiBody: Record<string, unknown> = { contents: geminiContents };
          if (system) { geminiBody.systemInstruction = { parts: [{ text: system }] }; }
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
          });
          if (!r.ok) { sse(ctrl, `[오류] Gemini ${r.status}`); ctrl.close(); return; }
          const reader = r.body?.getReader();
          if (!reader) { ctrl.close(); return; }
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try { const j = JSON.parse(line.slice(6)); const t = j.candidates?.[0]?.content?.parts?.[0]?.text; if (t) sse(ctrl, t); } catch {}
              }
            }
          }
        }
      } catch (e) {
        log.error("[lm/generate] 스트림 오류", { error: (e as Error).message });
        sse(ctrl, "[오류] 요청 처리 중 오류가 발생했습니다.");
      }
      ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
      ctrl.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
