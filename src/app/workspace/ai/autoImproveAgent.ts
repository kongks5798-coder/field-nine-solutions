// ── #5 CoWork Real-time AI Auto-Improve Agent ────────────────────────────────
// Continuous background improvement agent that analyzes generated code
// and suggests/auto-applies improvements in the workspace.

export interface ImprovementSuggestion {
  id: string;
  category: "design" | "ux" | "performance" | "accessibility" | "bug";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  autoFixable: boolean;
}

export interface AutoImproveConfig {
  /** Auto-apply high-severity improvements without asking */
  autoApplyHigh: boolean;
  /** Categories to focus on */
  focusCategories: ImprovementSuggestion["category"][];
  /** Maximum suggestions per analysis round */
  maxSuggestions: number;
}

export const DEFAULT_AUTO_IMPROVE_CONFIG: AutoImproveConfig = {
  autoApplyHigh: true,
  focusCategories: ["bug", "design", "ux", "performance", "accessibility"],
  maxSuggestions: 5,
};

/**
 * Build analysis prompt for the auto-improve agent.
 * Analyzes current code and returns structured improvement suggestions.
 */
export function buildAnalysisPrompt(ctx: {
  html: string;
  css: string;
  js: string;
  consoleErrors: string[];
  originalPrompt: string;
}): string {
  const errorSection = ctx.consoleErrors.length > 0
    ? `\n## 콘솔 에러:\n${ctx.consoleErrors.slice(0, 10).join("\n")}`
    : "";

  return `너는 코드 품질 개선 에이전트야. 아래 코드를 분석하고 개선점을 찾아줘.

## 원본 요청:
${ctx.originalPrompt}
${errorSection}

## 현재 코드:
[FILE:index.html]
${ctx.html.slice(0, 8000)}
[/FILE]

[FILE:style.css]
${ctx.css.slice(0, 5000)}
[/FILE]

[FILE:script.js]
${ctx.js.slice(0, 8000)}
[/FILE]

## 분석 기준:
1. **bug**: 에러, null 참조, 잘린 코드, 중괄호 불균형
2. **design**: 시각적 완성도 부족 (색상, 여백, 타이포그래피)
3. **ux**: 인터랙션 미흡 (안 되는 버튼, 검색, 모달)
4. **performance**: 성능 이슈 (불필요한 리플로우, 이벤트 과다)
5. **accessibility**: 접근성 부재 (ARIA, 키보드, 색상 대비)

## 출력 형식 (JSON만):
{
  "suggestions": [
    {
      "category": "bug",
      "severity": "high",
      "title": "script.js 중괄호 불균형",
      "description": "14개 열기 vs 12개 닫기 — 코드가 잘렸을 수 있음",
      "autoFixable": true
    }
  ]
}

JSON만 출력해. 최대 5개 제안.`;
}

/**
 * Parse the AI's improvement analysis response.
 */
export function parseAnalysisResponse(response: string): ImprovementSuggestion[] {
  const jsonMatch = response.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.suggestions)) return [];

    return parsed.suggestions.map((s: Record<string, unknown>, i: number) => ({
      id: `improve-${Date.now()}-${i}`,
      category: validateCategory(String(s.category ?? "bug")),
      severity: validateSeverity(String(s.severity ?? "medium")),
      title: String(s.title ?? "Unnamed issue"),
      description: String(s.description ?? ""),
      autoFixable: Boolean(s.autoFixable),
    }));
  } catch {
    return [];
  }
}

/**
 * Build a fix prompt for auto-fixable suggestions.
 */
export function buildAutoFixPrompt(
  suggestions: ImprovementSuggestion[],
  ctx: { html: string; css: string; js: string },
): string {
  const fixable = suggestions.filter(s => s.autoFixable);
  if (fixable.length === 0) return "";

  const parts: string[] = [];
  if (ctx.html) parts.push(`[FILE:index.html]\n${ctx.html.slice(0, 10000)}\n[/FILE]`);
  if (ctx.css) parts.push(`[FILE:style.css]\n${ctx.css.slice(0, 6000)}\n[/FILE]`);
  if (ctx.js) parts.push(`[FILE:script.js]\n${ctx.js.slice(0, 10000)}\n[/FILE]`);

  return `다음 문제들을 수정해줘:

${fixable.map((s, i) => `${i + 1}. [${s.severity.toUpperCase()}] ${s.title}: ${s.description}`).join("\n")}

## 규칙:
- 수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력
- 기존 기능 제거 금지
- 코드 자르기 금지

## 현재 코드:
${parts.join("\n\n")}`;
}

/**
 * Filter suggestions that should be auto-applied based on config.
 */
export function getAutoApplySuggestions(
  suggestions: ImprovementSuggestion[],
  config: AutoImproveConfig = DEFAULT_AUTO_IMPROVE_CONFIG,
): ImprovementSuggestion[] {
  return suggestions.filter(s => {
    if (!s.autoFixable) return false;
    if (!config.focusCategories.includes(s.category)) return false;
    if (config.autoApplyHigh && s.severity === "high") return true;
    return false;
  });
}

/**
 * Get Korean label for auto-improve status.
 */
export function getAutoImproveLabel(
  phase: "analyzing" | "fixing" | "complete" | "idle",
  count?: number,
): string {
  switch (phase) {
    case "analyzing": return "🔍 AI 자동 분석 중...";
    case "fixing": return `🔧 자동 개선 적용 중... (${count ?? 0}건)`;
    case "complete": return `✅ 자동 개선 완료 (${count ?? 0}건 수정)`;
    case "idle": return "";
  }
}

// ── Internal validators ──────────────────────────────────────────────────────

function validateCategory(cat: string): ImprovementSuggestion["category"] {
  const valid: ImprovementSuggestion["category"][] = ["design", "ux", "performance", "accessibility", "bug"];
  return valid.includes(cat as ImprovementSuggestion["category"])
    ? (cat as ImprovementSuggestion["category"])
    : "bug";
}

function validateSeverity(sev: string): ImprovementSuggestion["severity"] {
  const valid: ImprovementSuggestion["severity"][] = ["high", "medium", "low"];
  return valid.includes(sev as ImprovementSuggestion["severity"])
    ? (sev as ImprovementSuggestion["severity"])
    : "medium";
}
