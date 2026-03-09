// ── Stream Team ───────────────────────────────────────────────────────────────
// Parallel SSE streaming for HTML+CSS+JS simultaneous generation.
// Uses Promise.all to run 3 fetch requests concurrently.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BuilderRequest {
  prompt: string;
  system: string;
  mode: string; // 'anthropic' | 'openai' | etc
  modelId: string;
  maxTokens?: number;
}

export interface BuilderResult {
  content: string;
  file: "index.html" | "style.css" | "script.js";
  tokensUsed?: number;
}

export interface ParallelBuildResult {
  html: string;
  css: string;
  js: string;
  allDone: boolean;
}

export type BuildPhase =
  | "html"
  | "css"
  | "js"
  | "architect"
  | "critic"
  | "patcher";

export interface TeamProgressEvent {
  phase: BuildPhase;
  status: "start" | "chunk" | "done" | "error";
  partial?: string; // Partial content for live preview
  file?: string; // When done: the complete file content
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Stream a single file from /api/ai/stream.
 * Calls onProgress with throttled chunk events and a final done event.
 * Returns the full accumulated content.
 */
async function streamSingleFile(
  req: BuilderRequest,
  file: BuildPhase,
  onProgress: (event: TeamProgressEvent) => void,
): Promise<string> {
  const res = await fetch("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
      mode: req.mode,
      model: req.modelId,
      maxTokens: req.maxTokens ?? 8192,
    }),
  });

  if (!res.ok || !res.body) {
    onProgress({ phase: file, status: "error" });
    throw new Error(`Stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let lastProgressAt = 0;

  onProgress({ phase: file, status: "start" });

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(line.slice(6)) as { text?: string };
          if (parsed.text) acc += parsed.text;
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    // Throttled progress events: emit every 100 chars accumulated or every 500ms
    const now = Date.now();
    if (acc.length - lastProgressAt > 100 || now - lastProgressAt > 500) {
      lastProgressAt = acc.length;
      onProgress({ phase: file, status: "chunk", partial: acc });
    }
  }

  onProgress({ phase: file, status: "done", file: acc });
  return acc;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run HTML, CSS, and JS builders simultaneously using Promise.all.
 * Each builder streams independently and calls onProgress as chunks arrive.
 * Returns when all three streams are complete.
 */
export async function runParallelBuilders(
  requests: {
    html: BuilderRequest;
    css: BuilderRequest;
    js: BuilderRequest;
  },
  onProgress: (event: TeamProgressEvent) => void,
): Promise<ParallelBuildResult> {
  // Launch all 3 simultaneously
  const [htmlRaw, cssRaw, jsRaw] = await Promise.all([
    streamSingleFile(requests.html, "html", onProgress),
    streamSingleFile(requests.css, "css", onProgress),
    streamSingleFile(requests.js, "js", onProgress),
  ]);

  // Lazy import to avoid circular dependency issues
  const { parseAiResponse } = await import("./diffParser");

  const htmlParsed = parseAiResponse(htmlRaw);
  const cssParsed = parseAiResponse(cssRaw);
  const jsParsed = parseAiResponse(jsRaw);

  return {
    html: htmlParsed.fullFiles["index.html"] ?? htmlRaw,
    css: cssParsed.fullFiles["style.css"] ?? cssRaw,
    js: jsParsed.fullFiles["script.js"] ?? jsRaw,
    allDone: true,
  };
}

/**
 * Simple single-stream helper for Architect, Critic, and Patcher calls.
 * No parallel execution — just accumulates and returns the full response.
 */
export async function runSingleStream(
  req: BuilderRequest,
  onChunk?: (acc: string) => void,
): Promise<string> {
  const res = await fetch("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: req.system,
      messages: [{ role: "user", content: req.prompt }],
      mode: req.mode,
      model: req.modelId,
      maxTokens: req.maxTokens ?? 4096,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let lastChunkAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(line.slice(6)) as { text?: string };
          if (parsed.text) acc += parsed.text;
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    // Throttle onChunk callbacks (every 100 chars or 500ms)
    if (onChunk) {
      const now = Date.now();
      if (acc.length - lastChunkAt > 100 || now - lastChunkAt > 500) {
        lastChunkAt = acc.length;
        onChunk(acc);
      }
    }
  }

  // Final callback with the complete accumulated content
  if (onChunk) onChunk(acc);

  return acc;
}

/**
 * Fallback file content extractor when parseAiResponse doesn't find the file.
 * Tries [FILE:filename]...[/FILE] regex first, then falls back to raw content.
 */
export function extractFileFromRaw(raw: string, filename: string): string {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `\\[FILE:${escaped}\\]([\\s\\S]*?)(?:\\[\\/FILE\\]|$)`,
  );
  const match = re.exec(raw);
  if (match) {
    let content = match[1].trim();
    // Strip markdown code fences if present
    content = content.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
    return content.trim();
  }
  return raw;
}
