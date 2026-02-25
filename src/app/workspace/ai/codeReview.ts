// ── AI Code Review ──────────────────────────────────────────────────────────
// Client-side code quality analysis + AI-assisted review prompt builder.

export interface ReviewIssue {
  id: string;
  severity: "error" | "warning" | "info" | "suggestion";
  category: "security" | "performance" | "style" | "accessibility" | "bug";
  title: string;
  description: string;
  file: string;
  line?: number;
  fix?: string;
}

export interface CodeReviewReport {
  score: number;       // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  issues: ReviewIssue[];
  reviewedAt: string;
}

// ── Client-side patterns ────────────────────────────────────────────────────

const PATTERNS: {
  pattern: RegExp;
  title: string;
  severity: ReviewIssue["severity"];
  category: ReviewIssue["category"];
  description: string;
  fileFilter?: string;
}[] = [
  // Performance
  { pattern: /document\.querySelectorAll\([^)]+\)/g, title: "querySelectorAll 반복 호출",
    severity: "suggestion", category: "performance",
    description: "루프 밖에서 결과를 변수에 캐싱하세요", fileFilter: ".js" },
  { pattern: /\.innerHTML\s*\+=/g, title: "innerHTML += 사용",
    severity: "warning", category: "performance",
    description: "DOM 재파싱 발생. insertAdjacentHTML 또는 createElement 사용 권장" },

  // Accessibility
  { pattern: /<img(?![^>]*alt=)[^>]*>/gi, title: "img에 alt 속성 누락",
    severity: "warning", category: "accessibility",
    description: "스크린 리더를 위해 alt 속성을 추가하세요", fileFilter: ".html" },
  { pattern: /<input(?![^>]*(?:aria-label|id\s*=))[^>]*>/gi, title: "input에 label 연결 누락",
    severity: "info", category: "accessibility",
    description: "label 요소 또는 aria-label 속성을 추가하세요", fileFilter: ".html" },
  { pattern: /onclick\s*=/gi, title: "인라인 이벤트 핸들러",
    severity: "info", category: "accessibility",
    description: "addEventListener 사용을 권장합니다", fileFilter: ".html" },

  // Style
  { pattern: /console\.(log|debug)\s*\(/g, title: "console.log 남아있음",
    severity: "info", category: "style",
    description: "프로덕션에서 console.log를 제거하세요", fileFilter: ".js" },
  { pattern: /#[0-9a-fA-F]{3,8}\b/g, title: "하드코딩된 색상값",
    severity: "suggestion", category: "style",
    description: "CSS 변수(:root)를 사용하여 색상을 관리하세요", fileFilter: ".css" },
  { pattern: /!important/g, title: "!important 사용",
    severity: "suggestion", category: "style",
    description: "CSS 선택자 우선순위를 조정하여 !important를 피하세요", fileFilter: ".css" },
  { pattern: /var\s+\w+\s*=/g, title: "var 키워드 사용",
    severity: "suggestion", category: "style",
    description: "const 또는 let 사용을 권장합니다", fileFilter: ".js" },

  // Bug
  { pattern: /==(?!=)/g, title: "느슨한 동등 비교 (==)",
    severity: "warning", category: "bug",
    description: "엄격한 비교 (===)를 사용하세요" },
  { pattern: /\.addEventListener\([^)]*\)\s*(?!.*removeEventListener)/g, title: "이벤트 리스너 해제 누락 가능",
    severity: "info", category: "bug",
    description: "필요 시 removeEventListener로 정리하세요", fileFilter: ".js" },

  // Security
  { pattern: /eval\s*\(/g, title: "eval() 사용",
    severity: "error", category: "security",
    description: "eval은 코드 인젝션 위험이 있습니다" },
  { pattern: /document\.write\s*\(/g, title: "document.write 사용",
    severity: "warning", category: "security",
    description: "XSS 위험. DOM API를 사용하세요" },
];

/**
 * Client-side code review without AI.
 */
export function clientSideReview(files: Record<string, string>): CodeReviewReport {
  const issues: ReviewIssue[] = [];
  let issueId = 0;

  for (const [filename, content] of Object.entries(files)) {
    if (!content || content.length < 5) continue;

    for (const p of PATTERNS) {
      if (p.fileFilter && !filename.endsWith(p.fileFilter)) continue;
      p.pattern.lastIndex = 0;
      let match;
      let count = 0;
      while ((match = p.pattern.exec(content)) !== null && count < 3) {
        const line = content.slice(0, match.index).split("\n").length;
        issues.push({
          id: `cr-${++issueId}`,
          severity: p.severity,
          category: p.category,
          title: p.title,
          description: `${filename}:${line} — ${p.description}`,
          file: filename,
          line,
        });
        count++;
      }
    }

    // Check for missing viewport meta
    if (filename.endsWith(".html") && !content.includes("viewport")) {
      issues.push({
        id: `cr-${++issueId}`, severity: "warning", category: "accessibility",
        title: "viewport 메타 태그 누락",
        description: `${filename} — 모바일 반응형을 위해 viewport 메타 태그를 추가하세요`,
        file: filename,
      });
    }

    // Check for semantic HTML
    if (filename.endsWith(".html")) {
      const hasSemantic = /<(?:header|main|footer|nav|section|article)\b/i.test(content);
      if (!hasSemantic && content.length > 200) {
        issues.push({
          id: `cr-${++issueId}`, severity: "suggestion", category: "accessibility",
          title: "시맨틱 HTML 태그 미사용",
          description: `${filename} — header, main, footer, section 등 시맨틱 태그 사용을 권장합니다`,
          file: filename,
        });
      }
    }

    // Check for long functions (JS)
    if (filename.endsWith(".js")) {
      const funcRegex = /function\s+\w+\s*\([^)]*\)\s*\{/g;
      let fMatch;
      while ((fMatch = funcRegex.exec(content)) !== null) {
        const start = content.slice(0, fMatch.index).split("\n").length;
        // Simple brace counting
        let depth = 0;
        let end = start;
        for (let i = fMatch.index; i < content.length; i++) {
          if (content[i] === "{") depth++;
          if (content[i] === "}") { depth--; if (depth === 0) { end = content.slice(0, i).split("\n").length; break; } }
        }
        if (end - start > 50) {
          issues.push({
            id: `cr-${++issueId}`, severity: "suggestion", category: "style",
            title: "함수가 너무 김 (50줄 이상)",
            description: `${filename}:${start} — 함수를 작은 단위로 분리하세요 (${end - start}줄)`,
            file: filename, line: start,
          });
        }
      }
    }
  }

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warnCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;
  const sugCount = issues.filter(i => i.severity === "suggestion").length;
  const score = Math.max(0, 100 - errorCount * 25 - warnCount * 10 - infoCount * 3 - sugCount * 1);

  const grade: CodeReviewReport["grade"] =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return { score, grade, issues, reviewedAt: new Date().toISOString() };
}

/**
 * Build prompt for AI-assisted code review.
 */
export function buildCodeReviewPrompt(files: Record<string, string>): string {
  const fileCtx = Object.entries(files)
    .filter(([, c]) => c.length > 10)
    .map(([name, content]) => `[FILE:${name}]\n${content.slice(0, 8000)}\n[/FILE]`)
    .join("\n\n");

  return `다음 코드를 전문가 수준으로 리뷰해줘. 아래 카테고리별로 이슈를 찾아 JSON 배열로 응답해.

카테고리:
- security: 보안 취약점 (XSS, 인젝션, 노출된 키 등)
- performance: 성능 문제 (불필요한 재렌더링, 메모리 누수, 비효율적 DOM 조작)
- accessibility: 접근성 (alt 누락, ARIA, 키보드 내비게이션)
- style: 코드 스타일 (일관성, 가독성, 네이밍)
- bug: 잠재적 버그 (null 참조, 타입 오류, 로직 에러)

응답 형식 (JSON만 출력):
[
  { "severity": "error|warning|info|suggestion", "category": "...", "title": "...", "description": "...", "file": "...", "line": 0, "fix": "선택사항: 수정 코드" }
]

${fileCtx}`;
}

/**
 * Parse AI response into ReviewIssue array.
 */
export function parseCodeReviewResponse(response: string): ReviewIssue[] {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: Record<string, unknown>, i: number) => ({
      id: `ai-cr-${i}`,
      severity: (item.severity as ReviewIssue["severity"]) || "info",
      category: (item.category as ReviewIssue["category"]) || "style",
      title: String(item.title || ""),
      description: String(item.description || ""),
      file: String(item.file || ""),
      line: typeof item.line === "number" ? item.line : undefined,
      fix: item.fix ? String(item.fix) : undefined,
    }));
  } catch {
    return [];
  }
}

export function getReviewGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A: "우수", B: "양호", C: "보통", D: "주의", F: "위험",
  };
  return labels[grade] ?? "알 수 없음";
}
