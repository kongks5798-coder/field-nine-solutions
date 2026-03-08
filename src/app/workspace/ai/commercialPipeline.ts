// ── Commercial Pipeline ─────────────────────────────────────────────────────
// Multi-step generation pipeline for complex, commercial-grade web applications.
// Detects when a user prompt requires a platform-level app (e-commerce, video, etc.)
// and orchestrates 3-step sequential generation: HTML → CSS → JS.

import { detectPlatformType } from "./systemPromptBuilder";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PipelineStep {
  id: string;
  phase: "structure" | "styling" | "logic";
  targetFile: string;
  prompt: string;
  dependsOn: string[];
}

export interface PipelineConfig {
  steps: PipelineStep[];
  platformType: string | null;
}

// ── Complexity detection ─────────────────────────────────────────────────────

// ── Keyword patterns ─────────────────────────────────────────────────────────

/** New app creation keywords — always triggers 3-step pipeline */
const CREATE_KEYWORDS =
  /만들어|만들어줘|만들어주세요|만들어봐|만들고\s*싶|만들자|만들기|제작해|제작해줘|만들어볼까|create|build\s+a|make\s+a|개발해줘|작성해줘|generate|구현해줘|짜줘|설계해줘/i;

/** Modification-only keywords — skip pipeline if no creation intent */
const MODIFY_ONLY_KEYWORDS =
  /^(수정|변경|추가|삭제|고쳐|바꿔|넣어|없애|개선|리팩토링|fix|update|change|add|remove|modify|refactor)/i;

const PLATFORM_KEYWORDS =
  /유튜브|youtube|무신사|쇼핑몰|e-?commerce|인스타|instagram|대시보드|dashboard|트위치|twitch|쿠팡|소셜미디어|social media|온라인스토어|패션몰|비디오 사이트|어드민|admin|백오피스|음악 플레이어|music player|spotify|스포티파이|멜론|melon|포트폴리오|portfolio|랜딩|landing|메신저|messenger|카카오톡|slack|채팅 앱|게임|rpg|롤플레잉|격투|철권|액션게임|플랫폼게임|슈팅|퍼즐게임|전략게임|시뮬레이션|어드벤처|레이싱|테트리스급|리그오브레전드|배틀로얄|mmorpg|fps|로그라이크|react|리액트|vue|뷰\.?js|supabase|스파베이스|next\.?js|넥스트/i;

const QUALITY_KEYWORDS =
  /상용|commercial|production|프로덕션|프로급|전문|professional|고퀄|high.?quality|럭셔리|premium/i;

const SCALE_KEYWORDS =
  /전체|complete|풀스택|full.?stack|플랫폼|platform|완성|대규모|large.?scale|종합|게임|game|완전한|완벽한|작동하는|플레이어블/i;

/** High-complexity keywords — require Sonnet-level generation quality */
const HIGH_COMPLEXITY_KEYWORDS =
  /쇼핑몰|e-?commerce|대시보드|dashboard|게임|game|rpg|액션|플랫폼게임|슈팅|전략게임|시뮬레이션|실시간|real.?time|멀티플레이|소셜|sns|채팅|메신저|음악.*플레이어|music.*player|spotify|유튜브|youtube|어드민|admin|백오피스|back.?office|crm|erp|analytics|analytics.*대시|차트|chart|3d|three\.?js|물리.*엔진|physics/i;

/**
 * Detect if a prompt requires Sonnet-level generation (high complexity).
 * Returns true when the prompt describes a complex platform or game that
 * benefits from Sonnet's higher reasoning and output capacity.
 */
export function detectHighComplexity(prompt: string): boolean {
  return HIGH_COMPLEXITY_KEYWORDS.test(prompt) || QUALITY_KEYWORDS.test(prompt);
}

/**
 * Detect if a prompt requires multi-step commercial generation.
 * - Any "new app creation" request (CREATE_KEYWORDS) → always pipeline.
 * - Modification-only prompts on existing code → skip pipeline.
 * - Legacy keyword-based detection as fallback.
 */
export function detectCommercialRequest(
  prompt: string,
  hasExistingCode?: boolean,
): PipelineConfig | null {
  const trimmed = prompt.trim();

  // If purely a modification of existing code, don't use pipeline
  if (hasExistingCode && MODIFY_ONLY_KEYWORDS.test(trimmed) && !CREATE_KEYWORDS.test(trimmed)) {
    return null;
  }

  // Any new-app creation request → always use 3-step pipeline (prevents truncation)
  if (CREATE_KEYWORDS.test(trimmed) && trimmed.length > 20) {
    const platformType = detectPlatformType(trimmed);
    return buildPipelineConfig(trimmed, platformType);
  }

  // Legacy keyword-based detection
  const signals = [
    PLATFORM_KEYWORDS.test(prompt),
    QUALITY_KEYWORDS.test(prompt),
    SCALE_KEYWORDS.test(prompt),
  ];
  const matchCount = signals.filter(Boolean).length;
  if (matchCount < 1) return null;

  const platformType = detectPlatformType(prompt);
  return buildPipelineConfig(prompt, platformType);
}

// ── Quality upgrade detection ─────────────────────────────────────────────

const QUALITY_UPGRADE_KEYWORDS =
  /퀄리티|quality|개선해|improve|업그레이드|upgrade|고급화|수준.*(올|높|up)|상용화|상용급으로|프로급으로|리디자인|redesign|더.*좋게|더.*예쁘게|더.*멋지게|완성도|polish/i;

/**
 * Detect if the user is asking to improve quality of existing code
 * (not generate something new).
 */
export function detectQualityUpgrade(prompt: string): boolean {
  return QUALITY_UPGRADE_KEYWORDS.test(prompt);
}

/**
 * Build a generic commercial pipeline for prompts that don't match
 * specific platform keywords (used when commercial mode is forced).
 */
export function buildForcedPipeline(prompt: string): PipelineConfig {
  const platformType = detectPlatformType(prompt);
  return buildPipelineConfig(prompt, platformType);
}

// ── Pipeline construction ────────────────────────────────────────────────────

function buildPipelineConfig(
  userPrompt: string,
  platformType: string | null,
): PipelineConfig {
  const platformHint = platformType
    ? `This is a ${platformType} platform. Follow the platform blueprint instructions in the system prompt.`
    : "This is a complex commercial-grade web application.";

  return {
    platformType,
    steps: [
      {
        id: "step-html",
        phase: "structure",
        targetFile: "index.html",
        prompt: `${userPrompt}

## STEP 1/3: HTML STRUCTURE ONLY
${platformHint}
Generate ONLY the complete index.html file.
- Include ALL sections, navigation, modals, overlays, footers
- Use semantic HTML5 (header, nav, main, section, article, aside, footer)
- Add meaningful IDs and classes for CSS/JS hooks
- Include <link rel="stylesheet" href="style.css"> in head
- Include <script src="script.js"></script> at bottom of body
- Use emoji or inline SVG for icons, CSS gradient backgrounds for images
- Do NOT generate any CSS or JavaScript — only HTML
- Output: [FILE:index.html]...[/FILE] ONLY`,
        dependsOn: [],
      },
      {
        id: "step-css",
        phase: "styling",
        targetFile: "style.css",
        prompt: `## STEP 2/3: COMPLETE CSS STYLING
${platformHint}
Based on the HTML structure provided below, create the COMPLETE style.css file.

## Quality Requirements:
- Premium quality: gradients, glassmorphism, @keyframes animations, micro-interactions
- Fully responsive: mobile-first with @media breakpoints (320px, 768px, 1024px, 1440px)
- CSS Custom Properties (:root) for colors, fonts, spacing
- @import Pretendard font for Korean text: @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
- @import Google Fonts for headings if needed
- Hover effects, transitions (0.2s ease), focus styles (outline: 2px solid var(--accent))
- CSS Grid + Flexbox layout system
- Minimum 200 lines of CSS — never generate skeleton/placeholder CSS

## Korean App Styling Patterns (use as reference):
- Card style: border-radius: 12-16px, box-shadow: 0 2px 12px rgba(0,0,0,0.08)
- Sticky header: position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px)
- Bottom nav: position: fixed; bottom: 0; display: flex; border-top: 1px solid var(--border)
- Tab pills: border-radius: 20px; padding: 6px 16px; transition: all 0.2s
- Toast notification: position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%)
- Empty state: centered, large emoji, subtitle text, CTA button
- Do NOT generate HTML or JavaScript — only CSS
- Output: [FILE:style.css]...[/FILE] ONLY`,
        dependsOn: ["step-html"],
      },
      {
        id: "step-js",
        phase: "logic",
        targetFile: "script.js",
        prompt: `## STEP 3/3: COMPLETE JAVASCRIPT LOGIC
${platformHint}
Based on the HTML and CSS provided below, create the COMPLETE script.js file.

## FUNCTION SCOPE RULE (CRITICAL — must follow exactly):
- Define ALL functions at TOP-LEVEL scope: function greet() { ... } ← NOT inside DOMContentLoaded
- onclick="fn()" in HTML requires fn() to be globally accessible — wrap in DOMContentLoaded and it BREAKS
- Use DOMContentLoaded ONLY for initialization code that runs once (addEventListener calls, initial render)
- CORRECT pattern:
  function addToCart(id) { ... }  // top-level — accessible from onclick="addToCart(1)"
  document.addEventListener('DOMContentLoaded', function() {
    renderItems(); // initialization only
    document.getElementById('searchBtn')?.addEventListener('click', search);
  });
- WRONG pattern: document.addEventListener('DOMContentLoaded', function() { function addToCart() { ... } })

## REQUIRED FEATURES:
- Null-check every DOM element before use: const el = document.getElementById('x'); if (el) el.addEventListener(...)
- All interactions MUST work: navigation, modals, cart, forms, search, filters, tabs
- localStorage persistence for user data, cart, preferences
- Smooth animations via Web Animations API or CSS class toggles
- Event delegation where appropriate
- Mock data: realistic arrays of objects (products, videos, posts, etc.) — minimum 6-8 items
- IntersectionObserver for scroll-triggered animations
- Search/filter functionality that actually filters displayed items
- Do NOT generate HTML or CSS — only JavaScript
- Output: [FILE:script.js]...[/FILE] ONLY

## CRITICAL SYNTAX RULES:
- Every variable declaration MUST use let/const/var — NEVER a bare identifier
- Every statement MUST end with ; or be on its own line
- Every { must have a matching }
- Every function MUST be fully implemented — no placeholders, no // TODO
- Every string literal MUST be closed with matching quote
- Every array literal MUST be closed with ]
- Do NOT split variable declarations across lines: write "let cart = [];" on ONE line`,
        dependsOn: ["step-html", "step-css"],
      },
    ],
  };
}

/**
 * Build the prompt for a pipeline step, injecting context from previous steps.
 */
export function buildStepPrompt(
  step: PipelineStep,
  previousOutputs: Record<string, string>,
): string {
  let contextBlock = "";

  if (step.dependsOn.length > 0) {
    const contextParts: string[] = [];
    for (const depId of step.dependsOn) {
      const content = previousOutputs[depId];
      if (content) {
        const label = depId.replace("step-", "").toUpperCase();
        contextParts.push(`### ${label} (from previous step):\n\`\`\`\n${content}\n\`\`\``);
      }
    }
    if (contextParts.length > 0) {
      contextBlock = `\n\n## Context from previous steps:\n${contextParts.join("\n\n")}`;
    }
  }

  return step.prompt + contextBlock;
}

/**
 * Estimate total token cost for a pipeline (all steps combined).
 * Returns rough token count for UI display before the user commits to running.
 *
 * Breakdown per step:
 *   - BASE_INPUT: ~500 tokens for the step prompt itself
 *   - OUTPUT_PER_STEP: ~4000 tokens of generated output
 *   - CONTEXT_OVERHEAD: ~2000 tokens injected per upstream dependency (HTML/CSS context)
 */
export function estimatePipelineCost(pipeline: PipelineConfig): number {
  const OUTPUT_PER_STEP = 4000;
  const BASE_INPUT = 500;
  const CONTEXT_OVERHEAD = 2000; // per dependent step

  let total = 0;
  for (const step of pipeline.steps) {
    total += BASE_INPUT + OUTPUT_PER_STEP + (step.dependsOn.length * CONTEXT_OVERHEAD);
  }
  return total;
}

/**
 * Get a Korean progress label for UI display.
 */
export function getStepLabel(phase: PipelineStep["phase"], index: number, total: number): string {
  const labels: Record<string, string> = {
    structure: "HTML 구조 생성",
    styling: "CSS 스타일링",
    logic: "JavaScript 로직",
  };
  return `📦 상용급 생성 중... (${index + 1}/${total}: ${labels[phase] ?? phase})`;
}
