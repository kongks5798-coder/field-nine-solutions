// ── #4 Prompt Chaining + Quality Gates ──────────────────────────────────────
// 5-phase automatic refinement pipeline that transforms basic AI output
// into commercial-grade quality through sequential improvement rounds.

export interface RefinementPhase {
  id: string;
  label: string;
  labelKo: string;
  prompt: (ctx: RefinementContext) => string;
  /** If true, skip this phase when quality score already passes threshold */
  skipIfPassing?: boolean;
}

export interface RefinementContext {
  originalPrompt: string;
  html: string;
  css: string;
  js: string;
  qualityScore: number;
  platformType: string | null;
  iteration: number;
}

export interface RefinementResult {
  phaseId: string;
  files: Record<string, string>;
  skipped: boolean;
}

/**
 * 5-phase refinement pipeline.
 * Each phase sends a specialized improvement prompt with full file context.
 */
export const REFINEMENT_PHASES: RefinementPhase[] = [
  // Phase 1: Design Enhancement — Premium visual polish
  {
    id: "design-enhance",
    label: "Design Enhancement",
    labelKo: "디자인 고급화",
    prompt: (ctx) => `현재 생성된 앱의 디자인을 상용 수준으로 대폭 개선해줘.

## 개선 사항:
1. **컬러 시스템**: CSS 변수(:root)로 통일된 색상 팔레트 적용. 그라데이션, 글래스모피즘 효과
2. **타이포그래피**: Pretendard + 영문 Google Fonts 조합, 적절한 font-weight/line-height 계층
3. **미세 인터랙션**: hover 시 scale(1.02), box-shadow 변화, transition 0.25s ease
4. **레이아웃**: CSS Grid + Flexbox 기반 정교한 정렬, 적절한 gap/padding 체계
5. **아이콘/일러스트**: emoji 또는 인라인 SVG로 시각적 풍부함 추가
6. **배경**: 섬세한 그라데이션 또는 패턴, 섹션별 시각적 구분

수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력해.

${_buildFileContext(ctx)}`,
  },

  // Phase 2: Responsive + Accessibility
  {
    id: "responsive-a11y",
    label: "Responsive + Accessibility",
    labelKo: "반응형 + 접근성",
    prompt: (ctx) => `앱에 완벽한 반응형 디자인과 접근성을 추가해줘.

## 반응형:
1. **Mobile-first**: 320px, 375px, 768px, 1024px, 1440px 브레이크포인트
2. **모바일 네비게이션**: 햄버거 메뉴 + 슬라이드 사이드바
3. **터치 최적화**: 최소 44px 탭 영역, 적절한 간격
4. **이미지/그리드**: auto-fill minmax()로 유연한 레이아웃
5. **폰트**: clamp()로 유동적 텍스트 크기

## 접근성 (WCAG 2.1 AA):
1. **ARIA**: role, aria-label, aria-expanded, aria-hidden 적절히 사용
2. **키보드**: Tab 순서, focus-visible 스타일, Escape로 모달 닫기
3. **색상 대비**: 텍스트 4.5:1 이상, 큰 텍스트 3:1 이상
4. **Skip navigation**: 메인 콘텐츠 바로가기 링크

수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력해.

${_buildFileContext(ctx)}`,
  },

  // Phase 3: Interaction Polish — Make everything actually work
  {
    id: "interaction-polish",
    label: "Interaction Polish",
    labelKo: "인터랙션 완성",
    prompt: (ctx) => `앱의 모든 인터랙션이 완벽하게 동작하도록 JavaScript를 개선해줘.

## 필수 개선:
1. **모든 버튼/링크**: 실제로 동작하게 (no-op 금지). 클릭 피드백 + ripple effect
2. **검색/필터**: 실제 데이터 필터링, 결과 즉시 반영, "결과 없음" 처리
3. **모달/드롭다운**: 열기/닫기, 외부 클릭으로 닫기, Escape 닫기, 포커스 트랩
4. **폼**: 실시간 유효성 검사, 에러 메시지, 성공 피드백
5. **탭/아코디언**: 전환 애니메이션, 활성 상태 표시, 키보드 네비게이션
6. **스크롤 효과**: IntersectionObserver 기반 fade-in, parallax
7. **로컬 스토리지**: 사용자 데이터 영속, 장바구니/좋아요/설정 저장
8. **데이터**: 최소 10개 이상의 현실적 mock 데이터 (한국어)

script.js를 [FILE:script.js]...[/FILE] 형식으로 완전히 출력해.

${_buildFileContext(ctx)}`,
  },

  // Phase 4: Performance + Edge Cases
  {
    id: "perf-edge",
    label: "Performance + Edge Cases",
    labelKo: "성능 최적화 + 엣지케이스",
    skipIfPassing: true,
    prompt: (ctx) => `앱의 성능을 최적화하고 엣지케이스를 처리해줘.

## 성능:
1. **이벤트 최적화**: scroll/resize에 debounce/throttle 적용
2. **DOM 최적화**: DocumentFragment 사용, 불필요한 reflow 최소화
3. **이미지**: loading="lazy", 적절한 placeholder
4. **CSS**: will-change 힌트, contain 속성, GPU 가속 적용

## 엣지케이스:
1. **빈 상태**: 데이터 없을 때 빈 상태 UI (일러스트 + 안내 메시지)
2. **에러 상태**: 네트워크 오류, 유효하지 않은 입력 처리
3. **로딩 상태**: 스켈레톤 UI 또는 스피너
4. **오버플로우**: 긴 텍스트 말줄임, 작은 화면 스크롤 처리

수정된 파일만 [FILE:파일명]...[/FILE] 형식으로 출력해.

${_buildFileContext(ctx)}`,
  },

  // Phase 5: Final Quality Review
  {
    id: "final-review",
    label: "Final Quality Review",
    labelKo: "최종 품질 검증",
    skipIfPassing: true,
    prompt: (ctx) => `최종 품질 검증을 수행하고 미흡한 부분을 수정해줘.

## 자체 검증 체크리스트:
1. ✅ 모든 버튼이 실제로 동작하는가?
2. ✅ 모바일(375px)에서 레이아웃이 깨지지 않는가?
3. ✅ 색상 대비가 충분한가?
4. ✅ 콘솔 에러가 없는가?
5. ✅ 모든 null 참조가 방지되었는가?
6. ✅ DOMContentLoaded로 래핑되었는가?
7. ✅ localStorage 저장/불러오기가 정상 동작하는가?
8. ✅ @media 쿼리로 반응형이 적용되었는가?

문제가 있는 부분만 수정해서 [FILE:파일명]...[/FILE] 형식으로 출력해.
문제가 없으면 "모든 검증 통과 ✅"만 출력해.

${_buildFileContext(ctx)}`,
  },
];

function _buildFileContext(ctx: RefinementContext): string {
  const parts: string[] = [];
  if (ctx.html) parts.push(`[FILE:index.html]\n${ctx.html.slice(0, 12000)}\n[/FILE]`);
  if (ctx.css) parts.push(`[FILE:style.css]\n${ctx.css.slice(0, 8000)}\n[/FILE]`);
  if (ctx.js) parts.push(`[FILE:script.js]\n${ctx.js.slice(0, 12000)}\n[/FILE]`);
  return parts.length > 0 ? `\n현재 코드:\n${parts.join("\n\n")}` : "";
}

/** Determine how many refinement phases to run based on quality score */
export function getPhasesToRun(
  phases: RefinementPhase[],
  qualityScore: number,
  targetScore: number = 85,
): RefinementPhase[] {
  if (qualityScore >= targetScore) {
    // Already good — only run non-skippable phases
    return phases.filter(p => !p.skipIfPassing);
  }
  return phases;
}
