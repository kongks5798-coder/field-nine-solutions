// ── #1 Autonomous Self-Refine Loop ───────────────────────────────────────────
// AI evaluates its own output quality (1-10) and iteratively improves
// weak areas until score >= threshold or max rounds reached.

export interface SelfEvaluation {
  design: number;        // Visual quality 1-10
  functionality: number; // Interactive completeness 1-10
  responsiveness: number;// Mobile/responsive 1-10
  codeQuality: number;   // Clean code, no errors 1-10
  average: number;
  improvements: string[];
}

export interface RefineLoopConfig {
  maxRounds: number;     // Max improvement iterations (default: 3)
  targetScore: number;   // Stop when average >= this (default: 8)
}

export const DEFAULT_REFINE_CONFIG: RefineLoopConfig = {
  maxRounds: 3,
  targetScore: 8,
};

/**
 * Build prompt for AI to self-evaluate its own generated output.
 * Returns a structured JSON score + improvement suggestions.
 */
export function buildSelfEvalPrompt(ctx: {
  html: string;
  css: string;
  js: string;
  originalPrompt: string;
}): string {
  return `너는 코드 품질 심사관이야. 아래 코드를 사용자 요청 기준으로 엄격하게 평가해줘.

## 사용자 원본 요청:
${ctx.originalPrompt}

## 현재 코드:
[FILE:index.html]
${ctx.html.slice(0, 10000)}
[/FILE]

[FILE:style.css]
${ctx.css.slice(0, 6000)}
[/FILE]

[FILE:script.js]
${ctx.js.slice(0, 10000)}
[/FILE]

## 평가 기준 (각 1-10점):
1. **design**: 시각적 완성도 (색상 체계, 타이포그래피, 여백, 그라데이션, 글래스모피즘)
2. **functionality**: 인터랙션 완성도 (모든 버튼 동작, 검색/필터, 모달, 폼)
3. **responsiveness**: 반응형 (모바일 375px~데스크탑 1440px, @media 쿼리)
4. **codeQuality**: 코드 품질 (에러 없음, DOMContentLoaded, null체크, 중괄호 균형)

## 출력 형식 (반드시 JSON만):
{
  "design": 7,
  "functionality": 6,
  "responsiveness": 5,
  "codeQuality": 8,
  "improvements": [
    "CSS 변수(:root)로 색상 팔레트 통일 필요",
    "모바일 @media 쿼리 누락",
    "검색 기능 미구현"
  ]
}

JSON만 출력해. 다른 설명은 쓰지 마.`;
}

/**
 * Parse AI's self-evaluation JSON response.
 */
export function parseSelfEvaluation(response: string): SelfEvaluation | null {
  const jsonMatch = response.match(/\{[\s\S]*"design"[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const design = Number(parsed.design) || 5;
    const functionality = Number(parsed.functionality) || 5;
    const responsiveness = Number(parsed.responsiveness) || 5;
    const codeQuality = Number(parsed.codeQuality) || 5;
    const average = (design + functionality + responsiveness + codeQuality) / 4;
    const improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements.map(String)
      : [];

    return { design, functionality, responsiveness, codeQuality, average, improvements };
  } catch {
    return null;
  }
}

/**
 * Build improvement prompt targeting the weakest areas from self-evaluation.
 */
export function buildImprovementPrompt(
  evaluation: SelfEvaluation,
  ctx: { html: string; css: string; js: string },
): string {
  // Sort categories by score (lowest first)
  const scores: { name: string; score: number; focus: string }[] = [
    { name: "design", score: evaluation.design, focus: "디자인 개선 — CSS 변수, 그라데이션, 글래스모피즘, 타이포그래피, 미세 인터랙션 추가" },
    { name: "functionality", score: evaluation.functionality, focus: "기능 완성 — 모든 버튼 동작, 검색/필터, 모달, 폼 유효성, localStorage 저장" },
    { name: "responsiveness", score: evaluation.responsiveness, focus: "반응형 — @media 쿼리(375px, 768px, 1024px), 모바일 네비, clamp() 폰트" },
    { name: "codeQuality", score: evaluation.codeQuality, focus: "코드 품질 — DOMContentLoaded, null 체크, 에러 처리, 중괄호 균형" },
  ];
  scores.sort((a, b) => a.score - b.score);

  // Focus on the 2 weakest areas
  const weakAreas = scores.slice(0, 2);
  const improvementList = evaluation.improvements.length > 0
    ? `\n## AI 자체 분석 개선점:\n${evaluation.improvements.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    : "";

  const parts: string[] = [];
  if (ctx.html) parts.push(`[FILE:index.html]\n${ctx.html.slice(0, 10000)}\n[/FILE]`);
  if (ctx.css) parts.push(`[FILE:style.css]\n${ctx.css.slice(0, 6000)}\n[/FILE]`);
  if (ctx.js) parts.push(`[FILE:script.js]\n${ctx.js.slice(0, 10000)}\n[/FILE]`);

  return `아래 코드를 대폭 개선해줘. 특히 약한 영역을 집중 보강해.

## 집중 개선 영역:
${weakAreas.map((a, i) => `${i + 1}. **${a.name}** (현재 ${a.score}/10): ${a.focus}`).join("\n")}
${improvementList}

## 규칙:
- 수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력
- 기존 기능은 절대 제거하지 마
- 코드를 절대 자르지 마 — 완전한 파일 출력

## 현재 코드:
${parts.join("\n\n")}`;
}

/**
 * Check if another refinement round is needed.
 */
export function shouldContinueRefining(
  evaluation: SelfEvaluation | null,
  round: number,
  config: RefineLoopConfig = DEFAULT_REFINE_CONFIG,
): boolean {
  if (round >= config.maxRounds) return false;
  if (!evaluation) return true; // Couldn't parse eval, try one more round
  return evaluation.average < config.targetScore;
}
