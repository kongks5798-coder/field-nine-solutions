// ── #3 n8n Workflow API + Webhook ─────────────────────────────────────────────
// External webhook endpoint for n8n, Zapier, or custom automation.
// Accepts generation requests and returns results or triggers workspace actions.

import { NextRequest, NextResponse } from "next/server";

// Simple API key validation for webhook security
function validateWebhookKey(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const webhookKey = process.env.WORKFLOW_WEBHOOK_KEY;

  // If no key configured, allow in development
  if (!webhookKey) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${webhookKey}`;
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!validateWebhookKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      action = "generate",
      prompt,
      projectId,
      model = "gpt-4o-mini",
      mode = "openai",
      options = {},
    } = body;

    if (!prompt && action === "generate") {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 },
      );
    }

    switch (action) {
      case "generate": {
        // Trigger AI generation via internal stream API
        const streamBody = {
          system: buildWorkflowSystemPrompt(options),
          messages: [{ role: "user", content: prompt }],
          mode,
          model,
          temperature: options.temperature ?? 0.7,
          maxTokens: options.maxTokens ?? 16384,
        };

        const streamRes = await fetch(
          new URL("/api/ai/stream", request.url).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(streamBody),
          },
        );

        if (!streamRes.ok) {
          return NextResponse.json(
            { error: `AI stream failed: ${streamRes.status}` },
            { status: 502 },
          );
        }

        // Collect full response from SSE stream
        const reader = streamRes.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const { text } = JSON.parse(line.slice(6));
                  if (text) fullText += text;
                } catch { /* skip malformed chunks */ }
              }
            }
          }
        }

        // Parse [FILE:] blocks from response
        const files = parseFileBlocks(fullText);

        return NextResponse.json({
          success: true,
          action: "generate",
          projectId: projectId ?? null,
          files,
          rawLength: fullText.length,
          timestamp: new Date().toISOString(),
        });
      }

      case "evaluate": {
        // Quality evaluation of existing code
        const { html, css, js } = body;
        if (!html && !css && !js) {
          return NextResponse.json(
            { error: "Provide at least one of: html, css, js" },
            { status: 400 },
          );
        }

        const evaluation = evaluateCode({ html, css, js });
        return NextResponse.json({
          success: true,
          action: "evaluate",
          evaluation,
          timestamp: new Date().toISOString(),
        });
      }

      case "refine": {
        // Trigger refinement on existing code
        const { html, css, js, phase } = body;
        if (!html && !css && !js) {
          return NextResponse.json(
            { error: "Provide code to refine" },
            { status: 400 },
          );
        }

        const refinePrompt = buildRefinePrompt({ html, css, js }, phase ?? "all");
        const refineRes = await fetch(
          new URL("/api/ai/stream", request.url).toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system: "You are a code improvement specialist. Output only [FILE:filename]...[/FILE] blocks.",
              messages: [{ role: "user", content: refinePrompt }],
              mode,
              model,
              temperature: 0.5,
              maxTokens: options.maxTokens ?? 16384,
            }),
          },
        );

        if (!refineRes.ok) {
          return NextResponse.json(
            { error: `Refine failed: ${refineRes.status}` },
            { status: 502 },
          );
        }

        const refineReader = refineRes.body?.getReader();
        const refineDec = new TextDecoder();
        let refineText = "";
        if (refineReader) {
          while (true) {
            const { done, value } = await refineReader.read();
            if (done) break;
            for (const line of refineDec.decode(value).split("\n")) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const { text } = JSON.parse(line.slice(6));
                  if (text) refineText += text;
                } catch { /* skip */ }
              }
            }
          }
        }

        const refinedFiles = parseFileBlocks(refineText);
        return NextResponse.json({
          success: true,
          action: "refine",
          files: refinedFiles,
          timestamp: new Date().toISOString(),
        });
      }

      case "status": {
        return NextResponse.json({
          success: true,
          action: "status",
          status: "ready",
          capabilities: ["generate", "evaluate", "refine", "status"],
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: generate, evaluate, refine, status` },
          { status: 400 },
        );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Internal error: ${(err as Error)?.message ?? "unknown"}` },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildWorkflowSystemPrompt(options: Record<string, unknown>): string {
  const quality = options.quality ?? "commercial";
  const language = options.language ?? "ko";

  return `You are an expert web developer. Generate complete, production-quality web applications.

Rules:
- Output ONLY code in [FILE:filename]...[/FILE] blocks
- Generate: index.html, style.css, script.js
- ${quality === "commercial" ? "Commercial-grade quality: premium UI, full responsive, all interactions working" : "Standard quality"}
- ${language === "ko" ? "Use Korean for all UI text and mock data" : "Use English"}
- CSS: Custom properties, responsive @media queries, modern effects
- JS: DOMContentLoaded wrapper, null checks, localStorage persistence
- No external dependencies except Google Fonts
- No placeholder or TODO code — everything must work`;
}

function parseFileBlocks(text: string): Record<string, string> {
  const files: Record<string, string> = {};
  const regex = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();
    if (filename && content) {
      files[filename] = content;
    }
  }
  return files;
}

function evaluateCode(code: { html?: string; css?: string; js?: string }): {
  score: number;
  details: Record<string, number>;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  const html = code.html ?? "";
  const css = code.css ?? "";
  const js = code.js ?? "";

  // HTML checks
  if (!html) { issues.push("Missing HTML"); score -= 20; }
  else {
    if (!/<\/html>/i.test(html)) { issues.push("Unclosed HTML"); score -= 15; }
    if (!/<nav|<header/i.test(html)) { issues.push("No nav/header"); score -= 5; }
    if (html.split("\n").length < 50) { issues.push("HTML too short"); score -= 10; }
  }

  // CSS checks
  if (!css) { issues.push("Missing CSS"); score -= 20; }
  else {
    if (!css.includes("@media")) { issues.push("No responsive @media"); score -= 10; }
    if (!css.includes(":root") && !css.includes("var(--")) { issues.push("No CSS variables"); score -= 5; }
    if (css.split("\n").length < 100) { issues.push("CSS too short"); score -= 5; }
  }

  // JS checks
  if (!js) { issues.push("Missing JS"); score -= 20; }
  else {
    if (!/DOMContentLoaded/i.test(js)) { issues.push("No DOMContentLoaded"); score -= 10; }
    const open = (js.match(/\{/g) ?? []).length;
    const close = (js.match(/\}/g) ?? []).length;
    if (open !== close) { issues.push(`Brace mismatch: ${open} vs ${close}`); score -= 15; }
    if (js.split("\n").length < 50) { issues.push("JS too short"); score -= 5; }
  }

  return {
    score: Math.max(0, score),
    details: {
      html: html ? html.split("\n").length : 0,
      css: css ? css.split("\n").length : 0,
      js: js ? js.split("\n").length : 0,
    },
    issues,
  };
}

function buildRefinePrompt(
  code: { html?: string; css?: string; js?: string },
  phase: string,
): string {
  const parts: string[] = [];
  if (code.html) parts.push(`[FILE:index.html]\n${code.html.slice(0, 12000)}\n[/FILE]`);
  if (code.css) parts.push(`[FILE:style.css]\n${code.css.slice(0, 8000)}\n[/FILE]`);
  if (code.js) parts.push(`[FILE:script.js]\n${code.js.slice(0, 12000)}\n[/FILE]`);

  const phaseInstructions: Record<string, string> = {
    design: "디자인을 상용 수준으로 개선해줘. CSS 변수, 그라데이션, 글래스모피즘, 미세 인터랙션 추가.",
    responsive: "완벽한 반응형 디자인을 추가해줘. @media 쿼리, 모바일 네비, 터치 최적화.",
    interaction: "모든 인터랙션이 완벽하게 동작하도록 JS를 개선해줘. 버튼, 검색, 모달, 폼.",
    performance: "성능 최적화 + 엣지케이스 처리. debounce, lazy loading, 빈 상태 UI.",
    all: "전체적으로 상용 수준까지 품질을 높여줘. 디자인, 반응형, 인터랙션, 성능 모두.",
  };

  return `${phaseInstructions[phase] ?? phaseInstructions.all}

수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력해.

현재 코드:
${parts.join("\n\n")}`;
}
