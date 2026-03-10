// ── Team Pipeline ─────────────────────────────────────────────────────────────
// Streaming Team Agent Architecture
// Architect(Haiku,3s) → [HTML+CSS+JS parallel](Sonnet,15s) → Critic(Haiku,5s) → Patcher(Sonnet,8s)
// Total: ~31s vs previous 120s (4x faster)

import { getBoosterTemplate } from "./templateBooster";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ArchitectSpec {
  layout: 'single-page' | 'multi-section' | 'dashboard' | 'landing' | 'app';
  colorScheme: {
    primary: string;    // e.g. "#f97316"
    background: string; // e.g. "#050508"
    surface: string;    // e.g. "#0f0f1a"
    text: string;       // e.g. "#e2e8f0"
    accent: string;     // e.g. "#8b5cf6"
  };
  typography: {
    headingFont: string;  // e.g. "Pretendard"
    bodyFont: string;
  };
  components: string[];  // e.g. ["header", "hero", "product-grid", "cart-modal", "footer"]
  cssClasses: string[];  // e.g. ["card", "btn-primary", "nav-item", "modal-overlay"]
  theme: 'dark' | 'light';
  platformType: string | null;
  features: string[];    // e.g. ["search", "modal", "localStorage", "animations"]
}

export interface CriticIssue {
  severity: 'critical' | 'warning';
  file: 'index.html' | 'style.css' | 'script.js';
  description: string;
  fix: string;  // Specific fix instruction
}

export interface CriticReport {
  score: number;  // 0-100
  issues: CriticIssue[];
  passed: boolean;  // true if score >= 85 and no critical issues
}

export interface TeamPipelineConfig {
  userPrompt: string;
  platformType: string | null;
  systemPrompt: string;
}

// ── Architect ─────────────────────────────────────────────────────────────────

/**
 * Build the Architect agent prompt (Haiku-optimized: concise, JSON output).
 */
export function buildArchitectPrompt(
  userPrompt: string,
  platformType: string | null,
): string {
  const platformHint = platformType
    ? `\n참고: 이 앱은 ${platformType} 플랫폼이야. 해당 플랫폼에 적합한 스펙을 설계해.\n`
    : '';

  return `너는 웹앱 아키텍트야. 사용자 요청을 분석해서 설계 스펙을 JSON으로 출력해.
${platformHint}
## 요청:
${userPrompt}

## 출력 형식 (JSON만, 설명 없이):
{
  "layout": "single-page|multi-section|dashboard|landing|app",
  "colorScheme": { "primary": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "accent": "#hex" },
  "typography": { "headingFont": "폰트명", "bodyFont": "폰트명" },
  "components": ["컴포넌트1", "컴포넌트2"],
  "cssClasses": ["클래스1", "클래스2"],
  "theme": "dark|light",
  "platformType": "ecommerce|dashboard|portfolio|game|null",
  "features": ["feature1", "feature2"]
}

규칙:
- components: HTML의 주요 섹션/컴포넌트 이름 (kebab-case), 최대 10개
- cssClasses: HTML에서 사용할 핵심 CSS 클래스명, 최대 15개
- features: 필요한 JS 기능 목록
- 게임, 대시보드, 데이터 시각화, 애니메이션 앱의 경우:
  - platformType을 "game" 또는 "dashboard"로 설정
  - features에 적합한 CDN 라이브러리 추천: chart.js, three.js, p5.js, anime.js 등 (React 훅 절대 사용 금지 — vanilla JS만)
- 쇼핑몰, 리스트, 제품 앱의 경우 features에 "max-6-products" 포함 (JS 코드가 잘리지 않도록 데이터 6개 제한)
- JSON만 출력, 마크다운 코드펜스 없이

## 프로덕션 품질 필수 원칙:
- 완성된 프로덕션 수준 코드를 생성해 — '// TODO' 또는 '// add code here' 같은 placeholder 주석 절대 금지
- 게임의 경우: requestAnimationFrame을 사용한 완전한 게임 루프, 충돌 감지, 점수 시스템, 게임 오버 화면을 반드시 명세에 포함
- 필요한 라이브러리는 정확한 CDN URL을 명세화: 차트는 Chart.js, 오디오는 Tone.js, 애니메이션은 Anime.js
- 레이아웃은 항상 모바일 반응형으로 명세 (320px~1440px 전 구간 대응)`;
}

/**
 * Parse Architect JSON response into ArchitectSpec.
 * Falls back to sensible defaults if parsing fails.
 */
export function parseArchitectResponse(response: string): ArchitectSpec | null {
  // Strip markdown code fences if present
  const cleaned = response
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<ArchitectSpec>;

    const spec: ArchitectSpec = {
      layout: _validLayout(parsed.layout) ?? 'single-page',
      colorScheme: {
        primary:    parsed.colorScheme?.primary    ?? '#f97316',
        background: parsed.colorScheme?.background ?? '#050508',
        surface:    parsed.colorScheme?.surface    ?? '#0f0f1a',
        text:       parsed.colorScheme?.text       ?? '#e2e8f0',
        accent:     parsed.colorScheme?.accent     ?? '#8b5cf6',
      },
      typography: {
        headingFont: parsed.typography?.headingFont ?? 'Pretendard',
        bodyFont:    parsed.typography?.bodyFont    ?? 'Pretendard',
      },
      components: Array.isArray(parsed.components) ? parsed.components : ['header', 'main', 'footer'],
      cssClasses: Array.isArray(parsed.cssClasses) ? parsed.cssClasses : ['card', 'btn-primary', 'container'],
      theme:        _validTheme(parsed.theme) ?? 'dark',
      platformType: typeof parsed.platformType === 'string' && parsed.platformType !== 'null'
        ? parsed.platformType
        : null,
      features: Array.isArray(parsed.features) ? parsed.features : ['localStorage', 'animations'],
    };

    return spec;
  } catch {
    // Return null to signal caller to use fallback defaults
    return null;
  }
}

function _validLayout(v: unknown): ArchitectSpec['layout'] | null {
  const valid: ArchitectSpec['layout'][] = ['single-page', 'multi-section', 'dashboard', 'landing', 'app'];
  return valid.includes(v as ArchitectSpec['layout']) ? (v as ArchitectSpec['layout']) : null;
}

function _validTheme(v: unknown): ArchitectSpec['theme'] | null {
  return v === 'dark' || v === 'light' ? v : null;
}

// ── Parallel Builders ─────────────────────────────────────────────────────────

/**
 * Build the HTML-only builder prompt. Runs in parallel with CSS and JS builders.
 * Uses spec.components and spec.cssClasses as the shared contract.
 */
export function buildHtmlPrompt(
  spec: ArchitectSpec,
  userPrompt: string,
  platformType: string | null,
): string {
  const platformHint = platformType
    ? `\n이 앱은 ${platformType} 플랫폼이야. 해당 플랫폼의 표준 UI 구조를 따라.`
    : '';

  const booster = getBoosterTemplate(userPrompt);
  const boosterContext = booster
    ? `\n\n## 시작 구조 (이 HTML 골격을 발전시켜 완성하라 — 구조 유지, 내용·클래스 확장 가능):\n\`\`\`html\n${booster.html}\n\`\`\``
    : '';

  return `## HTML BUILDER — 독립 실행 모드
${platformHint}

## 설계 스펙:
- 레이아웃: ${spec.layout}
- 컴포넌트: ${spec.components.join(', ')}
- CSS 클래스: ${spec.cssClasses.join(', ')}
- 기능: ${spec.features.join(', ')}
- 테마: ${spec.theme}

## 요청:
${userPrompt}${boosterContext}

## 규칙:
- semantic HTML5만 (header, nav, main, section, article, aside, footer)
- ID/class는 반드시 스펙의 cssClasses 사용
- <link rel="stylesheet" href="style.css"> in head
- <script src="script.js"></script> at bottom of body
- CSS나 JavaScript 절대 포함 금지
- 인라인 SVG 아이콘, emoji 적극 활용
- [FILE:index.html]...[/FILE] 형식으로만 출력`;
}

/**
 * Build the CSS-only builder prompt. Runs in parallel with HTML and JS builders.
 * CSS knows class names from spec.cssClasses — no need to wait for HTML.
 */
export function buildCssPrompt(
  spec: ArchitectSpec,
  userPrompt: string,
  platformType: string | null,
): string {
  const platformHint = platformType
    ? `\n이 앱은 ${platformType} 플랫폼이야. 해당 플랫폼의 스타일 가이드를 따라.`
    : '';

  const booster = getBoosterTemplate(userPrompt);
  const boosterContext = booster
    ? `\n\n## 시작 스타일 (이 CSS 변수와 레이아웃 기반 위에 확장하라):\n\`\`\`css\n${booster.css}\n\`\`\``
    : '';

  return `## CSS BUILDER — 독립 실행 모드
${platformHint}

## 설계 스펙:
- 컬러: primary ${spec.colorScheme.primary}, bg ${spec.colorScheme.background}, surface ${spec.colorScheme.surface}
- 텍스트: ${spec.colorScheme.text}, accent: ${spec.colorScheme.accent}
- 폰트: ${spec.typography.headingFont} / ${spec.typography.bodyFont}
- CSS 클래스: ${spec.cssClasses.join(', ')}
- 테마: ${spec.theme}

## 요청 (참고):
${userPrompt}${boosterContext}

## 규칙:
- :root에 CSS Custom Properties로 모든 색상/폰트/spacing 정의
- @import Pretendard (한국어) + Google Fonts if needed
- 모든 .${spec.cssClasses.join(', .')} 스타일 정의 (스펙의 클래스를 빠짐없이)
- Mobile-first @media (320px, 768px, 1024px, 1440px)
- hover transitions (0.2s ease), focus-visible styles
- glassmorphism, gradients, @keyframes animations 적극 활용
- 최소 250줄 이상
- HTML이나 JavaScript 절대 포함 금지
- [FILE:style.css]...[/FILE] 형식으로만 출력`;
}

/**
 * Build the JS-only builder prompt. Runs in parallel with HTML and CSS builders.
 */
export function buildJsPrompt(
  spec: ArchitectSpec,
  userPrompt: string,
  platformType: string | null,
): string {
  const platformHint = platformType
    ? `\n이 앱은 ${platformType} 플랫폼이야. 해당 플랫폼의 핵심 기능을 구현해.`
    : '';

  const featureList = spec.features.map(f => `- ${f}`).join('\n');

  const booster = getBoosterTemplate(userPrompt);
  const boosterContext = booster
    ? `\n\n## 시작 코드 (이 JS 골격 위에 기능을 추가·확장하라 — 기존 함수명과 변수명 유지):\n\`\`\`javascript\n${booster.js}\n\`\`\``
    : '';

  return `## JS BUILDER — 독립 실행 모드
${platformHint}

## 설계 스펙:
- 필요 기능: ${spec.features.join(', ')}
- 컴포넌트: ${spec.components.join(', ')}
- CSS 클래스: ${spec.cssClasses.join(', ')} ← DOM 조작에 이 클래스 사용

## 요청 (참고):
${userPrompt}${boosterContext}

## FUNCTION SCOPE 규칙 (CRITICAL):
- 모든 함수는 TOP-LEVEL: function myFn() {} ← NOT DOMContentLoaded 내부
- DOMContentLoaded는 초기화 코드만 (addEventListener, 첫 렌더)
- onclick="fn()" → fn()이 전역이어야 동작

## 필수 구현:
${featureList}
- localStorage 데이터 영속
- null-check: const el = document.getElementById('x'); if (el) el.addEventListener(...)
- 한국어 mock 데이터 최소 6개, 최대 6개 (더 많으면 JS가 잘림 — 절대 초과 금지)
- 배열/객체의 모든 문자열 값은 반드시 따옴표로 감싸야 함: sizes: ['XS', 'S', 'M'], NOT sizes: [XS, S, M]
- 한국어 단어도 반드시 따옴표 필수: ['봄', '여름'] NOT [봄, 여름]
- HTML이나 CSS 절대 포함 금지
- [FILE:script.js]...[/FILE] 형식으로만 출력

## 프로덕션 품질 필수 원칙:
- 완전한 JavaScript를 작성해 — '...rest of code' 또는 '// similar for other' 같은 생략 절대 금지
- 모든 함수는 완전히 구현해 (함수 본체가 비어있거나 TODO 주석만 있는 함수 금지)
- 모든 엣지 케이스를 처리해: 빈 상태(empty state), 에러 상태(error state), 로딩 상태(loading state)
- 모든 이벤트 리스너는 적절히 정리(cleanup)해 — 메모리 누수 방지
- 프로덕션 코드에 console.log 사용 금지`;
}

// ── Critic ────────────────────────────────────────────────────────────────────

/**
 * Build the Critic agent prompt (Haiku-optimized: fast analysis, JSON output).
 */
export function buildCriticPrompt(html: string, css: string, js: string): string {
  return `너는 코드 리뷰 에이전트야. 3개 파일을 분석해서 문제점을 JSON으로 출력해.

## 검사 기준:
1. HTML의 id/class가 CSS/JS에서 실제로 사용되는가?
2. CSS 클래스가 HTML에 존재하는가?
3. JS의 document.getElementById/querySelector 대상이 HTML에 있는가?
4. 중괄호 균형 (JS 브레이스 카운트)
5. </html> 닫힘 여부
6. viewport meta 있는가?
7. @media 쿼리 있는가?
8. 빈 버튼/링크 있는가?

## 파일:
[FILE:index.html]
${html.slice(0, 6000)}
[/FILE]

[FILE:style.css]
${css.slice(0, 4000)}
[/FILE]

[FILE:script.js]
${js.slice(0, 6000)}
[/FILE]

## 출력 (JSON만):
{
  "score": 0-100,
  "issues": [
    { "severity": "critical|warning", "file": "index.html|style.css|script.js", "description": "문제 설명", "fix": "구체적 수정 방법" }
  ]
}

문제 없으면: { "score": 95, "issues": [] }
JSON만 출력, 마크다운 없이`;
}

/**
 * Parse Critic JSON response into CriticReport.
 * Falls back to a passing report if parsing fails.
 */
export function parseCriticResponse(response: string): CriticReport {
  const cleaned = response
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      score?: unknown;
      issues?: unknown[];
    };

    const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 80;
    const issues: CriticIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues
          .filter((i): i is Record<string, unknown> => typeof i === 'object' && i !== null)
          .map(i => ({
            severity: i['severity'] === 'critical' ? 'critical' : 'warning',
            file:     _validCriticFile(i['file']) ?? 'index.html',
            description: typeof i['description'] === 'string' ? i['description'] : '',
            fix:         typeof i['fix'] === 'string' ? i['fix'] : '',
          }))
      : [];

    return {
      score,
      issues,
      passed: score >= 85 && !issues.some(i => i.severity === 'critical'),
    };
  } catch {
    return { score: 80, issues: [], passed: true };
  }
}

function _validCriticFile(v: unknown): CriticIssue['file'] | null {
  const valid: CriticIssue['file'][] = ['index.html', 'style.css', 'script.js'];
  return valid.includes(v as CriticIssue['file']) ? (v as CriticIssue['file']) : null;
}

// ── Patcher ───────────────────────────────────────────────────────────────────

/**
 * Build the Patcher agent prompt. Only called when Critic finds issues.
 */
export function buildPatcherPrompt(
  report: CriticReport,
  html: string,
  css: string,
  js: string,
): string {
  const issueList = report.issues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.severity.toUpperCase()}] [${issue.file}] ${issue.description}\n   수정: ${issue.fix}`,
    )
    .join('\n\n');

  return `다음 문제들을 수정해줘:

${issueList}

## 규칙:
- 문제가 있는 파일만 [FILE:파일명]...[/FILE] 형식으로 출력
- 기존 기능 절대 제거 금지
- 코드 자르기 금지 (파일 완전히 출력)

## 현재 코드:
[FILE:index.html]
${html.slice(0, 8000)}
[/FILE]

[FILE:style.css]
${css.slice(0, 6000)}
[/FILE]

[FILE:script.js]
${js.slice(0, 8000)}
[/FILE]`;
}

// ── Progress Labels ───────────────────────────────────────────────────────────

const TEAM_PIPELINE_LABELS: Record<string, string> = {
  'architect':  '🎯 설계 중...',
  'building':   '⚡ HTML · CSS · JS 동시 생성 중...',
  'html-done':  '🏗️ HTML 완성 → CSS·JS 생성 중...',
  'css-done':   '🎨 CSS 완성 → JS 생성 중...',
  'js-done':    '⚙️ JS 완성 → 검증 중...',
  'critic':     '🔍 품질 검증 중...',
  'done':       '✅ 생성 완료',
};

/**
 * Get a Korean progress label for the given pipeline phase.
 * The `patching` phase accepts an optional detail (issue count).
 */
export function getTeamPipelineLabel(phase: string, detail?: string): string {
  if (phase === 'patching') {
    return `🔧 ${detail ?? ''}개 문제 수정 중...`;
  }
  return TEAM_PIPELINE_LABELS[phase] ?? phase;
}
