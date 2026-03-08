// ── Quality Validator ────────────────────────────────────────────────────────
// Post-generation quality checks for commercial-grade applications.
// Validates file completeness, code size, responsiveness, and syntax balance.

export interface QualityIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  file: string;
  suggestion?: string;
}

export interface QualityReport {
  score: number;
  issues: QualityIssue[];
  passed: boolean;
}

/**
 * Validate generated files for commercial-grade quality.
 * @param files - Record of filename -> content
 * @param platformType - detected platform type (null for regular apps)
 */
export function validateCommercialQuality(
  files: Record<string, string>,
  platformType: string | null,
): QualityReport {
  const issues: QualityIssue[] = [];

  const htmlContent = files["index.html"] ?? "";
  const cssContent = files["style.css"] ?? "";
  const jsContent = files["script.js"] ?? "";

  // ── File completeness ──────────────────────────────────────────────────
  if (!htmlContent) issues.push({ severity: "error", category: "completeness", message: "Missing index.html", file: "index.html" });
  if (!cssContent) issues.push({ severity: "error", category: "completeness", message: "Missing style.css", file: "style.css" });
  if (!jsContent) issues.push({ severity: "error", category: "completeness", message: "Missing script.js", file: "script.js" });

  // ── Minimum line counts ────────────────────────────────────────────────
  const htmlLines = htmlContent.split("\n").length;
  const cssLines = cssContent.split("\n").length;
  const jsLines = jsContent.split("\n").length;

  if (platformType) {
    if (htmlLines < 200) issues.push({ severity: "warning", category: "size", message: `HTML too short (${htmlLines} lines, expected 200+ for platform)`, file: "index.html" });
    if (cssLines < 300) issues.push({ severity: "warning", category: "size", message: `CSS too short (${cssLines} lines, expected 300+ for platform)`, file: "style.css" });
    if (jsLines < 200) issues.push({ severity: "warning", category: "size", message: `JS too short (${jsLines} lines, expected 200+ for platform)`, file: "script.js" });
  } else {
    if (htmlLines < 50) issues.push({ severity: "warning", category: "size", message: `HTML very short (${htmlLines} lines)`, file: "index.html" });
    if (jsContent && jsLines < 30) issues.push({ severity: "info", category: "size", message: `JS short (${jsLines} lines)`, file: "script.js" });
  }

  // ── Viewport meta ──────────────────────────────────────────────────────
  if (htmlContent && !/<meta[^>]+name=["']viewport["']/i.test(htmlContent)) {
    issues.push({ severity: "warning", category: "responsive", message: "Missing <meta name=\"viewport\"> — mobile layout will be broken", file: "index.html" });
  }

  // ── Responsive design ──────────────────────────────────────────────────
  if (cssContent && !cssContent.includes("@media")) {
    issues.push({ severity: "warning", category: "responsive", message: "No @media queries found — may not be responsive", file: "style.css" });
  }

  // ── Font-family declaration ─────────────────────────────────────────────
  if (cssContent && !/font-family\s*:/i.test(cssContent)) {
    issues.push({ severity: "warning", category: "typography", message: "No font-family declaration found — browser default font will be used", file: "style.css" });
  }

  // ── Navigation/structure ───────────────────────────────────────────────
  if (htmlContent && !/<nav|<header/i.test(htmlContent)) {
    issues.push({ severity: "warning", category: "structure", message: "No <nav> or <header> element found", file: "index.html" });
  }

  // ── JS brace balance (truncation detection) ────────────────────────────
  if (jsContent) {
    const openBraces = (jsContent.match(/\{/g) ?? []).length;
    const closeBraces = (jsContent.match(/\}/g) ?? []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        severity: "error",
        category: "syntax",
        message: `Mismatched braces: ${openBraces} open vs ${closeBraces} close (possible truncation)`,
        file: "script.js",
      });
    }
  }

  // ── DOMContentLoaded ───────────────────────────────────────────────────
  if (jsContent && !/DOMContentLoaded|addEventListener\s*\(\s*['"](?:DOMContentLoaded|load)['"]/i.test(jsContent)) {
    issues.push({ severity: "warning", category: "runtime", message: "No DOMContentLoaded wrapper — may cause null reference errors", file: "script.js" });
  }

  // ── HTML closing tag ───────────────────────────────────────────────────
  if (htmlContent && !/<\/html>/i.test(htmlContent)) {
    issues.push({ severity: "error", category: "syntax", message: "Missing </html> closing tag (possible truncation)", file: "index.html" });
  }

  // ── Score calculation (base) ───────────────────────────────────────────
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  let score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  // ── Accessibility checks ───────────────────────────────────────────────
  if (htmlContent) {
    // Images without alt text
    const imgWithoutAlt = (htmlContent.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
    if (imgWithoutAlt > 0) {
      issues.push({
        severity: "warning",
        category: "accessibility",
        file: "index.html",
        message: `이미지 ${imgWithoutAlt}개에 alt 속성 없음 (접근성 위반)`,
        suggestion: "모든 <img> 태그에 alt 속성 추가",
      });
      score -= 3 * Math.min(imgWithoutAlt, 3);
    }

    // Buttons without accessible text
    const emptyButtons = (htmlContent.match(/<button[^>]*>\s*<\/button>/gi) ?? []).length;
    if (emptyButtons > 0) {
      issues.push({
        severity: "warning",
        category: "accessibility",
        file: "index.html",
        message: `빈 버튼 ${emptyButtons}개 (스크린리더 접근 불가)`,
        suggestion: "버튼에 텍스트 또는 aria-label 추가",
      });
      score -= 5;
    }

    // Missing lang attribute
    if (!/<html[^>]+lang=/i.test(htmlContent)) {
      issues.push({
        severity: "warning",
        category: "accessibility",
        file: "index.html",
        message: '<html> 태그에 lang 속성 없음',
        suggestion: '<html lang="ko"> 추가',
      });
      score -= 3;
    }
  }

  score = Math.max(0, score);

  return { score, issues, passed: score >= 70 };
}

/**
 * Build a fix prompt from quality issues for auto-repair.
 */
export function buildQualityFixPrompt(report: QualityReport): string {
  const errorIssues = report.issues.filter(i => i.severity === "error");
  const responsiveIssues = report.issues.filter(
    i => i.severity === "warning" && i.category === "responsive",
  );
  const typographyIssues = report.issues.filter(
    i => i.severity === "warning" && i.category === "typography",
  );

  const a11yIssues = report.issues.filter(
    i => i.severity === "warning" && i.category === "accessibility",
  );

  const actionableIssues = [...errorIssues, ...responsiveIssues, ...typographyIssues, ...a11yIssues];
  if (actionableIssues.length === 0) return "";

  const lines: string[] = actionableIssues.map(i => `- [${i.file}] ${i.message}`);

  const fixInstructions: string[] = [];
  if (responsiveIssues.some(i => i.message.includes("viewport"))) {
    fixInstructions.push('index.html <head>에 <meta name="viewport" content="width=device-width, initial-scale=1.0"> 추가');
  }
  if (responsiveIssues.some(i => i.message.includes("@media"))) {
    fixInstructions.push("style.css에 모바일(max-width: 768px) 및 태블릿(max-width: 1024px) @media 쿼리 추가");
  }
  if (typographyIssues.length > 0) {
    fixInstructions.push("style.css :root 또는 body에 font-family 선언 추가 (예: 'Noto Sans KR', sans-serif)");
  }
  if (a11yIssues.length > 0) {
    fixInstructions.push(`## 접근성 수정 (Accessibility):\n${a11yIssues.map(i => `- ${i.message}: ${i.suggestion}`).join("\n")}`);
  }

  const instructionBlock = fixInstructions.length > 0
    ? `\n\n수정 방법:\n${fixInstructions.map(f => `• ${f}`).join("\n")}`
    : "";

  return `코드 품질 검사에서 다음 문제가 발견되었습니다:\n${lines.join("\n")}${instructionBlock}\n\n이 문제들을 수정해주세요. 수정된 파일을 [FILE:]...[/FILE] 블록으로 출력하세요.`;
}
