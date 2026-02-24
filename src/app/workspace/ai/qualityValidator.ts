// ── Quality Validator ────────────────────────────────────────────────────────
// Post-generation quality checks for commercial-grade applications.
// Validates file completeness, code size, responsiveness, and syntax balance.

export interface QualityIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  file: string;
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

  // ── Responsive design ──────────────────────────────────────────────────
  if (cssContent && !cssContent.includes("@media")) {
    issues.push({ severity: "warning", category: "responsive", message: "No @media queries found — may not be responsive", file: "style.css" });
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

  // ── Score calculation ──────────────────────────────────────────────────
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  return { score, issues, passed: score >= 70 };
}

/**
 * Build a fix prompt from quality issues for auto-repair.
 */
export function buildQualityFixPrompt(report: QualityReport): string {
  const errorIssues = report.issues.filter(i => i.severity === "error");
  if (errorIssues.length === 0) return "";

  return `코드 품질 검사에서 다음 문제가 발견되었습니다:\n${errorIssues.map(i => `- [${i.file}] ${i.message}`).join("\n")}\n\n이 문제들을 수정해주세요. 수정된 파일을 [FILE:]...[/FILE] 블록으로 출력하세요.`;
}
