// ── #3 Design Mode — Image/Screenshot → Code ────────────────────────────────
// Transforms uploaded images, screenshots, or design mockups into
// complete HTML/CSS/JS code using vision-capable AI models.

/**
 * Build a prompt that instructs the AI to convert a visual design
 * into production-quality code.
 */
export function buildDesignToCodePrompt(options: {
  description?: string;
  style?: "modern" | "minimal" | "glassmorphism" | "neomorphism";
  responsive?: boolean;
  interactive?: boolean;
}): string {
  const {
    description = "",
    style = "modern",
    responsive = true,
    interactive = true,
  } = options;

  const styleGuide: Record<string, string> = {
    modern: "모던 UI — 그라데이션, 둥근 모서리, 풍부한 그림자, 깔끔한 여백",
    minimal: "미니멀 — 단순 색상, 넓은 여백, 작은 텍스트, 직선적 레이아웃",
    glassmorphism: "글래스모피즘 — backdrop-filter: blur, 반투명 배경, 부드러운 경계",
    neomorphism: "뉴모피즘 — 부드러운 음영, 눌린/튀어나온 효과, 파스텔 톤",
  };

  return `이 이미지를 보고 동일한 디자인의 웹 앱을 완벽하게 재현해줘.

## 디자인 스타일:
${styleGuide[style]}

${description ? `## 추가 설명:\n${description}\n` : ""}
## 필수 사항:
1. **HTML**: 시맨틱 구조, 모든 요소/섹션 포함, 이미지의 레이아웃 100% 재현
2. **CSS**:
   - :root 변수로 색상/폰트 통일
   - 이미지의 정확한 색상, 폰트 크기, 여백 재현
   ${responsive ? "- @media 쿼리로 완벽한 반응형 (375px~1440px)" : ""}
   - 호버/포커스 효과, 트랜지션
   - Pretendard + Google Fonts 조합
3. **JavaScript**:
   ${interactive ? "- 모든 버튼, 링크, 폼이 실제로 동작" : "- 기본 인터랙션만"}
   - DOMContentLoaded 래핑
   - null 체크
   - mock 데이터 (한국어)
4. **아이콘/이미지**: emoji 또는 인라인 SVG 사용 (외부 이미지 URL 금지)

## 출력:
[FILE:index.html]...[/FILE]
[FILE:style.css]...[/FILE]
[FILE:script.js]...[/FILE]

이미지를 정밀하게 분석하고, 1px까지 동일하게 재현해.`;
}

/**
 * Build a prompt to convert a Figma-style design description
 * (text-based, no image) into code.
 */
export function buildFigmaImportPrompt(figmaDescription: string): string {
  return `다음 디자인 명세에 따라 웹 앱을 완벽하게 구현해줘.

## 디자인 명세:
${figmaDescription}

## 필수 사항:
1. 명세의 모든 요소, 색상, 폰트, 여백을 정확히 재현
2. CSS 변수(:root)로 디자인 토큰 관리
3. 완벽한 반응형 (@media 쿼리)
4. 모든 인터랙션 동작 (버튼, 폼, 모달)
5. DOMContentLoaded + null 체크
6. 한국어 mock 데이터

## 출력:
[FILE:index.html]...[/FILE]
[FILE:style.css]...[/FILE]
[FILE:script.js]...[/FILE]`;
}

/**
 * Check if a model supports vision (image input).
 * Returns true for models that can process images.
 */
export function isVisionModel(modelId: string): boolean {
  const visionModels = [
    "gpt-4o", "gpt-4o-mini",
    "claude-sonnet-4-5-20250514", "claude-sonnet-4-6", "claude-opus-4-6",
    "gemini-1.5-flash", "gemini-2.0-flash",
  ];
  return visionModels.some(id => modelId.includes(id));
}

/**
 * Get the best vision model from available models.
 */
export function getBestVisionModel(availableModels: { id: string }[]): string {
  const preferred = [
    "claude-sonnet-4-6",
    "gpt-4o",
    "gemini-2.0-flash",
    "gpt-4o-mini",
    "gemini-1.5-flash",
  ];
  for (const id of preferred) {
    if (availableModels.find(m => m.id === id)) return id;
  }
  return availableModels[0]?.id ?? "gpt-4o-mini";
}
