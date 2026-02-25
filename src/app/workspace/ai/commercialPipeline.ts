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

const PLATFORM_KEYWORDS =
  /유튜브|youtube|무신사|쇼핑몰|e-?commerce|인스타|instagram|대시보드|dashboard|트위치|twitch|쿠팡|소셜미디어|social media|온라인스토어|패션몰|비디오 사이트|어드민|admin|백오피스|음악 플레이어|music player|spotify|스포티파이|멜론|melon|포트폴리오|portfolio|랜딩|landing|메신저|messenger|카카오톡|slack|채팅 앱/i;

const QUALITY_KEYWORDS =
  /상용|commercial|production|프로덕션|프로급|전문|professional|고퀄|high.?quality|럭셔리|premium/i;

const SCALE_KEYWORDS =
  /전체|complete|풀스택|full.?stack|플랫폼|platform|완성|대규모|large.?scale|종합/i;

/**
 * Detect if a prompt requires multi-step commercial generation.
 * Returns PipelineConfig when 2+ complexity signals match, null otherwise.
 */
export function detectCommercialRequest(prompt: string): PipelineConfig | null {
  const signals = [
    PLATFORM_KEYWORDS.test(prompt),
    QUALITY_KEYWORDS.test(prompt),
    SCALE_KEYWORDS.test(prompt),
  ];
  const matchCount = signals.filter(Boolean).length;

  // Platform keyword alone is sufficient (strongest signal)
  if (!signals[0] && matchCount < 2) return null;
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
- Premium quality: gradients, glassmorphism, @keyframes animations, micro-interactions
- Fully responsive: mobile-first with @media breakpoints (320px, 768px, 1024px, 1440px)
- CSS Custom Properties (:root) for colors, fonts, spacing
- Dark/light compatible design (use CSS variables)
- @import Pretendard font for Korean text
- @import Google Fonts for headings
- Hover effects, transitions (0.3s ease), focus states
- CSS Grid + Flexbox layout system
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
- Wrap ALL code in DOMContentLoaded listener
- Null-check every DOM element before use (el?.addEventListener)
- All interactions MUST work: navigation, modals, cart, forms, search, filters, tabs
- localStorage persistence for user data, cart, preferences
- Smooth animations via Web Animations API or CSS class toggles
- Event delegation where appropriate
- Mock data: realistic arrays of objects (products, videos, posts, etc.)
- IntersectionObserver for scroll-triggered animations
- Search/filter functionality that actually filters displayed items
- Do NOT generate HTML or CSS — only JavaScript
- Output: [FILE:script.js]...[/FILE] ONLY`,
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
