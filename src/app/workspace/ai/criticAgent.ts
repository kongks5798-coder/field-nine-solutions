// ── Critic Agent ──────────────────────────────────────────────────────────────
// Replaces the 5-phase refinement pipeline with a faster 2-step approach:
// 1. Critic (Haiku): analyzes all 3 files simultaneously → structured issue list
// 2. Patcher (Sonnet): targeted fixes only for found issues
// Total: 5s + 8s = 13s vs 75s for 5-phase refinement

import { validateCommercialQuality } from "./qualityValidator";
import type { QualityIssue } from "./qualityValidator";
import { parseAiResponse } from "./diffParser";

/** Fast JS syntax check using new Function() — returns error message or null */
function checkJsSyntaxFast(js: string): string | null {
  if (!js || js.trim().length < 20) return null;
  const stripped = js
    .replace(/^(import|export\s+default|export\s+\{[^}]*\}|export)\s+.*/gm, "")
    .replace(/^\s*@\w+.*/gm, "");
  try {
    new Function(stripped);
    return null;
  } catch (e) {
    const msg = (e as Error).message ?? "Unknown syntax error";
    // Ignore false positives
    if (/Unexpected token '\.'/i.test(msg)) return null;
    if (/Unexpected token '\?'/i.test(msg)) return null;
    if (/Unexpected token '<'/i.test(msg)) return null;
    if (/Unexpected token ','/i.test(msg)) return null;
    // Only skip "Unexpected identifier" for async/await keywords themselves (false positive from new Function wrapper)
    if (/Unexpected identifier 'async'/i.test(msg)) return null;
    if (/Unexpected identifier 'await'/i.test(msg)) return null;
    if (/Unexpected identifier 'of'/i.test(msg)) return null;
    return msg;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CriticIssue {
  severity: "critical" | "warning";
  file: "index.html" | "style.css" | "script.js";
  description: string;
  fix: string;
}

export interface CriticReport {
  score: number;
  issues: CriticIssue[];
  passed: boolean;
}

// StreamFn type — injected to avoid circular imports
export type StreamFn = (req: {
  prompt: string;
  system: string;
  mode: string;
  modelId: string;
  maxTokens: number;
}) => Promise<string>;

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Map qualityValidator severity to CriticIssue severity */
function mapSeverity(s: QualityIssue["severity"]): CriticIssue["severity"] {
  return s === "error" ? "critical" : "warning";
}

/** Narrow a raw string to a valid CriticIssue file union, or null if unrecognised */
function toValidFile(
  raw: string,
): "index.html" | "style.css" | "script.js" | null {
  if (raw === "index.html" || raw === "style.css" || raw === "script.js") {
    return raw;
  }
  return null;
}

/** Parse raw AI JSON response → CriticIssue[] */
function parseCriticJson(text: string): {
  score: number;
  issues: CriticIssue[];
} {
  const jsonMatch = text.match(/\{[\s\S]*"score"[\s\S]*\}/);
  if (!jsonMatch) return { score: 70, issues: [] };

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (typeof parsed !== "object" || parsed === null) {
      return { score: 70, issues: [] };
    }
    const obj = parsed as Record<string, unknown>;

    const rawScore = Number(obj["score"] ?? 70);
    const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : 70;

    const rawIssues = Array.isArray(obj["issues"]) ? obj["issues"] : [];
    const issues: CriticIssue[] = [];

    for (const item of rawIssues) {
      if (typeof item !== "object" || item === null) continue;
      const i = item as Record<string, unknown>;

      const rawFile = String(i["file"] ?? "");
      const validFile = toValidFile(rawFile);
      if (!validFile) continue;

      const rawSeverity = String(i["severity"] ?? "warning");
      const severity: CriticIssue["severity"] =
        rawSeverity === "critical" ? "critical" : "warning";

      issues.push({
        severity,
        file: validFile,
        description: String(i["description"] ?? ""),
        fix: String(i["fix"] ?? ""),
      });
    }

    return { score, issues };
  } catch {
    return { score: 70, issues: [] };
  }
}

// ── shouldRunCritic ───────────────────────────────────────────────────────────

/**
 * Quick pre-check before running the AI Critic.
 * - Returns false if files are too short (< 50 lines each) — not worth criticising
 * - Returns false if JS brace mismatch is very severe (already broken — skip refinement)
 * - Returns true otherwise
 */
export function shouldRunCritic(
  html: string,
  css: string,
  js: string,
): boolean {
  const htmlLines = html.split("\n").length;
  const cssLines = css.split("\n").length;
  const jsLines = js.split("\n").length;

  // 단순 앱(타이머, 계산기 등) 스킵 — 80줄 미만이면 Critic 불필요
  if (htmlLines < 80 || cssLines < 80 || jsLines < 80) return false;

  // Severely broken JS (brace diff > 20) — don't attempt refinement
  const openBraces = (js.match(/\{/g) ?? []).length;
  const closeBraces = (js.match(/\}/g) ?? []).length;
  if (Math.abs(openBraces - closeBraces) > 20) return false;

  return true;
}

// ── mergeCriticWithValidator ──────────────────────────────────────────────────

/**
 * Merges AI Critic results with static qualityValidator results.
 * Deduplicates by (file + description similarity).
 * AI issues take priority over static ones.
 */
export function mergeCriticWithValidator(
  aiReport: CriticReport,
  validatorIssues: QualityIssue[],
): CriticReport {
  // Convert validator issues to CriticIssue shape
  const staticCriticIssues: CriticIssue[] = validatorIssues
    .filter((qi): qi is QualityIssue & { file: "index.html" | "style.css" | "script.js" } =>
      toValidFile(qi.file) !== null,
    )
    .map((qi) => ({
      severity: mapSeverity(qi.severity),
      file: toValidFile(qi.file) as "index.html" | "style.css" | "script.js",
      description: qi.message,
      fix: qi.suggestion ?? "See description for guidance",
    }));

  // Start with AI issues (higher priority)
  const merged: CriticIssue[] = [...aiReport.issues];

  // Add static issues only if not already covered by AI issues
  for (const staticIssue of staticCriticIssues) {
    const isDuplicate = merged.some(
      (existing) =>
        existing.file === staticIssue.file &&
        (existing.description
          .toLowerCase()
          .includes(staticIssue.description.toLowerCase().slice(0, 20)) ||
          staticIssue.description
            .toLowerCase()
            .includes(existing.description.toLowerCase().slice(0, 20))),
    );
    if (!isDuplicate) {
      merged.push(staticIssue);
    }
  }

  // Recalculate score: AI score is base, penalise additional static issues
  const extraStatic = merged.length - aiReport.issues.length;
  const extraPenalty =
    merged
      .slice(aiReport.issues.length)
      .filter((i) => i.severity === "critical").length *
      10 +
    extraStatic * 2;
  const finalScore = Math.max(0, aiReport.score - extraPenalty);
  const hasCritical = merged.some((i) => i.severity === "critical");

  return {
    score: finalScore,
    issues: merged,
    // Pass only if score ≥ 85 AND no critical issues remain
    passed: finalScore >= 85 && !hasCritical,
  };
}

// ── runCriticAnalysis ─────────────────────────────────────────────────────────

/**
 * Step 1 — Critic (Haiku): analyses all 3 files simultaneously and returns a
 * structured CriticReport.
 */
export async function runCriticAnalysis(
  html: string,
  css: string,
  js: string,
  streamFn: StreamFn,
): Promise<CriticReport> {
  // 1. Run static checks first (free, instant)
  const validatorReport = validateCommercialQuality(
    { "index.html": html, "style.css": css, "script.js": js },
    null,
  );

  const staticIssues = validatorReport.issues;

  // 1b. JS syntax check — always treat as critical (forces patcher)
  const jsSyntaxErr = checkJsSyntaxFast(js);
  if (jsSyntaxErr) {
    staticIssues.push({
      file: "script.js",
      category: "syntax",
      severity: "error",
      message: `SyntaxError: ${jsSyntaxErr}`,
      suggestion: "Fix the JavaScript syntax error so the script can execute.",
    });
  }

  // 2. Build Critic prompt (Haiku-optimised — fast & token-efficient)
  const staticSummary =
    staticIssues.length > 0
      ? staticIssues
          .map((i) => `- [${i.severity}][${i.file}] ${i.message}`)
          .join("\n")
      : "- 없음";

  const jsFunctionList =
    js.match(/function\s+\w+|const\s+\w+\s*=/g)?.slice(0, 20).join(", ") ??
    "N/A";

  const cssClassList =
    css
      .match(/\.[a-z-]+\s*\{/g)
      ?.slice(0, 20)
      .map((c) => c.trim())
      .join(", ") ?? "N/A";

  const criticPrompt = `너는 코드 리뷰 에이전트야. 3개 파일을 빠르게 분석해서 핵심 문제만 JSON으로 출력해.

## 이미 발견된 정적 분석 결과:
${staticSummary}

## 추가 분석 필요:
1. HTML의 getElementById/querySelector 대상이 HTML에 존재하는가?
2. CSS 클래스가 HTML에서 실제 사용되는가?
3. 인터랙션이 실제로 동작하는가? (이벤트 리스너, 함수 정의)
4. 반응형 레이아웃이 완성되었는가?

## 코드 (핵심 부분만):
HTML: ${html.slice(0, 3000)}
JS 함수 목록: ${jsFunctionList}
CSS 클래스: ${cssClassList}

## 출력 (JSON만, 설명 없이):
{ "score": 0-100, "issues": [{ "severity": "critical|warning", "file": "index.html|style.css|script.js", "description": "...", "fix": "..." }] }
최대 6개 이슈만. JSON만 출력.`;

  // 3. Call Haiku (fast, cheap)
  let aiResponseText = "";
  try {
    aiResponseText = await streamFn({
      prompt: criticPrompt,
      system:
        "You are a fast code reviewer. Output only valid JSON. No explanations.",
      mode: "chat",
      modelId: "claude-haiku-4-5-20251001",
      maxTokens: 800,
    });
  } catch {
    // If AI call fails, fall back to static analysis only
    return {
      score: validatorReport.score,
      issues: staticIssues
        .filter(
          (qi): qi is QualityIssue & { file: "index.html" | "style.css" | "script.js" } =>
            toValidFile(qi.file) !== null,
        )
        .map((qi) => ({
          severity: mapSeverity(qi.severity),
          file: toValidFile(qi.file) as "index.html" | "style.css" | "script.js",
          description: qi.message,
          fix: qi.suggestion ?? "",
        })),
      passed: validatorReport.passed,
    };
  }

  // 4. Parse AI JSON response
  const { score: aiScore, issues: aiIssues } = parseCriticJson(aiResponseText);

  const aiReport: CriticReport = {
    score: aiScore,
    issues: aiIssues,
    passed: aiScore >= 85 && !aiIssues.some((i) => i.severity === "critical"),
  };

  // 5. Merge static + AI issues, deduplicate
  return mergeCriticWithValidator(aiReport, staticIssues);
}

// ── runPatcherFix ─────────────────────────────────────────────────────────────

/**
 * Step 2 — Patcher (Sonnet): targeted fixes for issues found by the Critic.
 * Only called when report.passed === false or critical issues exist.
 */
export async function runPatcherFix(
  report: CriticReport,
  html: string,
  css: string,
  js: string,
  streamFn: StreamFn,
): Promise<{ html: string; css: string; js: string }> {
  // Only patch if there are actionable issues
  const criticalIssues = report.issues.filter(
    (i) => i.severity === "critical",
  );
  const allIssues = criticalIssues.length > 0 ? criticalIssues : report.issues;

  if (allIssues.length === 0) {
    return { html, css, js };
  }

  // Determine which files actually have issues (to minimise token usage)
  const filesWithIssues = new Set(allIssues.map((i) => i.file));

  const filesToInclude: string[] = [];
  if (filesWithIssues.has("index.html")) {
    filesToInclude.push(`[FILE:index.html]\n${html}\n[/FILE]`);
  }
  if (filesWithIssues.has("style.css")) {
    filesToInclude.push(`[FILE:style.css]\n${css}\n[/FILE]`);
  }
  if (filesWithIssues.has("script.js")) {
    filesToInclude.push(`[FILE:script.js]\n${js}\n[/FILE]`);
  }

  const issueList = allIssues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.file}] ${issue.description}\n   → ${issue.fix}`,
    )
    .join("\n\n");

  const patcherPrompt = `다음 문제들을 수정해줘. 수정이 필요한 파일만 완전히 출력해.

## 수정 목록:
${issueList}

## 규칙:
- 수정된 파일만 [FILE:파일명]...[/FILE]로 출력
- 기존 기능 제거 금지
- 파일 내용 자르기 금지

## 현재 코드:
${filesToInclude.join("\n\n")}`;

  // Call Sonnet (precise, targeted fixes)
  let patchResponse = "";
  try {
    patchResponse = await streamFn({
      prompt: patcherPrompt,
      system:
        "You are a production-grade code patcher. Fix all listed issues including SyntaxErrors — ensure the JavaScript is fully valid and executable. Output complete fixed files inside [FILE:filename]...[/FILE] blocks. Never truncate code.",
      mode: "chat",
      modelId: "claude-sonnet-4-6",
      maxTokens: 8000,
    });
  } catch {
    // If patch fails, return originals unchanged
    return { html, css, js };
  }

  // Parse [FILE:] blocks from response
  const parsed = parseAiResponse(patchResponse);

  const patchResult = {
    html: parsed.fullFiles["index.html"] ?? html,
    css: parsed.fullFiles["style.css"] ?? css,
    js: parsed.fullFiles["script.js"] ?? js,
  };

  // ── PASS 2: Syntax-only re-patch if JS still has SyntaxErrors ──────────────
  const remainingSyntaxErr = checkJsSyntaxFast(patchResult.js);
  if (remainingSyntaxErr) {
    const syntaxPatchPrompt = `script.js에 아직 SyntaxError가 있어: "${remainingSyntaxErr}"
다음 JavaScript 코드를 수정해서 문법 오류를 완전히 제거해줘.
괄호 불균형, 잘못된 토큰, 미완성 구문을 고쳐.
기존 기능 제거 금지. 파일 전체를 [FILE:script.js]...[/FILE]로 출력해.

[FILE:script.js]
${patchResult.js}
[/FILE]`;

    try {
      const pass2Response = await streamFn({
        prompt: syntaxPatchPrompt,
        system:
          "You are a JavaScript syntax fixer. Output only the corrected script.js inside [FILE:script.js]...[/FILE]. Never truncate. Ensure the file is syntactically valid.",
        mode: "chat",
        modelId: "claude-sonnet-4-6",
        maxTokens: 12000,
      });
      const parsed2 = parseAiResponse(pass2Response);
      if (parsed2.fullFiles["script.js"]) {
        patchResult.js = parsed2.fullFiles["script.js"];
      }
    } catch {
      // Keep pass-1 result if pass-2 fails
    }
  }

  return patchResult;
}
