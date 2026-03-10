// ── Edit Pipeline ──────────────────────────────────────────────────────────────
// Targeted code edit for existing apps.
// User: "버튼을 파란색으로 바꿔줘" → patches only the changed CSS file
// Triggered when: hasExistingCode + edit-like prompt (not new app creation)

// ── Edit detection ─────────────────────────────────────────────────────────────

const EDIT_KEYWORDS_KO = [
  "바꿔", "바꾸", "변경", "수정", "고쳐", "고치", "추가", "넣어", "넣고", "삭제", "제거",
  "색상", "색깔", "컬러", "크기", "폰트", "글씨", "글자", "배경", "버튼", "텍스트", "아이콘",
  "움직이게", "움직여", "애니메이션", "효과", "그림자", "테두리", "여백", "패딩", "마진",
  "더 예쁘게", "더 크게", "더 작게", "더 빠르게", "더 밝게", "더 어둡게",
  "대신", "으로", "로 바", "스타일", "디자인을", "레이아웃을",
];

const EDIT_KEYWORDS_EN = [
  "change", "modify", "update", "edit", "adjust", "tweak",
  "add", "remove", "delete", "replace", "rename",
  "make it", "make the", "turn the", "set the",
  "color", "size", "font", "style", "layout", "background",
  "bigger", "smaller", "faster", "darker", "lighter",
];

const NEW_APP_KEYWORDS = [
  "만들어줘", "만들어", "만들고", "만드", "새로 만들", "새로운", "처음부터",
  "create a", "build a", "build me", "make a", "generate a", "new app", "from scratch", "rebuild",
];

/**
 * Detect if a user prompt is an edit request on existing code,
 * vs a new app creation request.
 */
export function isEditRequest(prompt: string, hasExistingCode: boolean): boolean {
  if (!hasExistingCode) return false;

  const lower = prompt.toLowerCase();

  // If it looks like a new app request, always generate fresh
  if (NEW_APP_KEYWORDS.some(k => lower.includes(k))) return false;

  // If prompt is very long (>80 chars) and doesn't have edit keywords, assume new app
  const hasEditKw =
    EDIT_KEYWORDS_KO.some(k => lower.includes(k)) ||
    EDIT_KEYWORDS_EN.some(k => lower.includes(k));

  if (!hasEditKw && prompt.length > 80) return false;

  // Short prompt with existing code → assume edit
  if (prompt.length <= 80) return true;

  return hasEditKw;
}

// ── Edit prompt ────────────────────────────────────────────────────────────────

/**
 * Build the prompt for targeted edit of existing HTML/CSS/JS.
 * The AI only outputs files that actually changed.
 */
export function buildEditPrompt(
  instruction: string,
  html: string,
  css: string,
  js: string,
): string {
  // Trim each file to avoid exceeding context window
  const htmlTrimmed = html.length > 6000 ? html.slice(0, 6000) + "\n/* ... truncated ... */" : html;
  const cssTrimmed = css.length > 5000 ? css.slice(0, 5000) + "\n/* ... truncated ... */" : css;
  const jsTrimmed = js.length > 6000 ? js.slice(0, 6000) + "\n// ... truncated ..." : js;

  return `사용자 수정 요청: "${instruction}"

## 현재 코드:
[FILE:index.html]
${htmlTrimmed}
[/FILE]

[FILE:style.css]
${cssTrimmed}
[/FILE]

[FILE:script.js]
${jsTrimmed}
[/FILE]

## 규칙:
- 수정이 필요한 파일만 [FILE:파일명]...[/FILE] 형식으로 출력
- 변경 없는 파일은 출력하지 않음
- 파일 전체를 완전히 출력 (생략/자르기 금지)
- 기존 기능 제거 금지
- 코드 품질 유지`;
}

// ── Edit system prompt ─────────────────────────────────────────────────────────

export const EDIT_SYSTEM_PROMPT =
  "You are a precise code editor. Apply only the changes requested by the user. " +
  "Output only the files that changed, inside [FILE:filename]...[/FILE] blocks. " +
  "Preserve all existing functionality. Never truncate file contents. " +
  "Output complete, valid HTML/CSS/JavaScript.";
