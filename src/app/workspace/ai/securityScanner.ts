// ── #4 Security Scanner ──────────────────────────────────────────────────────
// Client-side code security analysis for detecting common vulnerabilities,
// exposed secrets, and security anti-patterns.

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "secrets" | "xss" | "injection" | "auth" | "crypto" | "misc";
  title: string;
  description: string;
  file: string;
  line?: number;
}

export interface SecurityReport {
  score: number;       // 0-100 (100 = secure)
  grade: "A" | "B" | "C" | "D" | "F";
  issues: SecurityIssue[];
  scannedAt: string;
}

// ── Patterns ─────────────────────────────────────────────────────────────────

const SECRET_PATTERNS: { pattern: RegExp; title: string }[] = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/gi, title: "API 키 노출" },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi, title: "비밀번호/시크릿 하드코딩" },
  { pattern: /sk-[A-Za-z0-9]{20,}/g, title: "OpenAI API 키 노출" },
  { pattern: /AIza[A-Za-z0-9_\-]{35}/g, title: "Google API 키 노출" },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, title: "GitHub 토큰 노출" },
  { pattern: /(?:Bearer|Authorization)\s*[:=]\s*['"][A-Za-z0-9._\-]{20,}['"]/gi, title: "인증 토큰 하드코딩" },
];

const XSS_PATTERNS: { pattern: RegExp; title: string }[] = [
  { pattern: /\.innerHTML\s*=(?!\s*['"]<)/g, title: "innerHTML에 동적 값 삽입 (XSS 위험)" },
  { pattern: /document\.write\s*\(/g, title: "document.write 사용 (XSS 위험)" },
  { pattern: /eval\s*\(/g, title: "eval() 사용 (코드 인젝션 위험)" },
  { pattern: /new\s+Function\s*\(/g, title: "new Function() 사용 (코드 인젝션)" },
  { pattern: /on\w+\s*=\s*["'](?!return false)/gi, title: "인라인 이벤트 핸들러 (CSP 위반)" },
];

const AUTH_PATTERNS: { pattern: RegExp; title: string }[] = [
  { pattern: /(?:cors|Access-Control-Allow-Origin)\s*[:=]\s*['"]?\*/gi, title: "CORS 와일드카드 (*)" },
  { pattern: /http:\/\/(?!localhost)/g, title: "비암호화 HTTP 사용" },
  { pattern: /localStorage\.setItem\s*\(\s*['"](?:token|jwt|session|auth)/gi, title: "인증 토큰 localStorage 저장 (XSS에 취약)" },
];

const CRYPTO_PATTERNS: { pattern: RegExp; title: string }[] = [
  { pattern: /md5\s*\(/gi, title: "MD5 해시 사용 (취약한 암호화)" },
  { pattern: /sha1\s*\(/gi, title: "SHA1 해시 사용 (취약한 암호화)" },
  { pattern: /Math\.random\s*\(\s*\)/g, title: "Math.random() 보안 용도 사용 금지" },
];

/**
 * Scan code files for security vulnerabilities.
 * Returns a comprehensive security report with score and issues.
 */
export function scanSecurity(files: Record<string, string>): SecurityReport {
  const issues: SecurityIssue[] = [];
  let issueId = 0;

  for (const [filename, content] of Object.entries(files)) {
    if (!content || content.length < 10) continue;
    const lines = content.split("\n");

    // Check each pattern category
    for (const { pattern, title } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split("\n").length;
        issues.push({
          id: `sec-${++issueId}`,
          severity: "critical",
          category: "secrets",
          title,
          description: `${filename}:${line} — 민감한 정보가 코드에 직접 포함되어 있습니다.`,
          file: filename,
          line,
        });
      }
    }

    for (const { pattern, title } of XSS_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split("\n").length;
        issues.push({
          id: `sec-${++issueId}`,
          severity: "high",
          category: "xss",
          title,
          description: `${filename}:${line} — 크로스 사이트 스크립팅(XSS) 취약점 가능성`,
          file: filename,
          line,
        });
      }
    }

    for (const { pattern, title } of AUTH_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split("\n").length;
        issues.push({
          id: `sec-${++issueId}`,
          severity: "medium",
          category: "auth",
          title,
          description: `${filename}:${line} — 인증/보안 설정 문제`,
          file: filename,
          line,
        });
      }
    }

    for (const { pattern, title } of CRYPTO_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split("\n").length;
        issues.push({
          id: `sec-${++issueId}`,
          severity: "medium",
          category: "crypto",
          title,
          description: `${filename}:${line} — 약한 암호화 알고리즘 사용`,
          file: filename,
          line,
        });
      }
    }

    // Check for missing security headers in HTML
    if (filename.endsWith(".html")) {
      if (!content.includes("Content-Security-Policy") && !content.includes("meta http-equiv")) {
        issues.push({
          id: `sec-${++issueId}`,
          severity: "low",
          category: "misc",
          title: "CSP 헤더 미설정",
          description: `${filename} — Content-Security-Policy 미설정`,
          file: filename,
        });
      }
    }

    // Check for console.log with sensitive data patterns
    for (let i = 0; i < lines.length; i++) {
      if (/console\.(log|debug)\s*\(.*(?:password|token|secret|key|auth)/i.test(lines[i])) {
        issues.push({
          id: `sec-${++issueId}`,
          severity: "medium",
          category: "secrets",
          title: "콘솔에 민감한 데이터 출력",
          description: `${filename}:${i + 1} — 민감한 정보가 콘솔에 로그될 수 있습니다.`,
          file: filename,
          line: i + 1,
        });
      }
    }
  }

  // Calculate score
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const medCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;
  const score = Math.max(0, 100 - criticalCount * 30 - highCount * 15 - medCount * 5 - lowCount * 2);

  const grade: SecurityReport["grade"] =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return {
    score,
    grade,
    issues,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Get Korean label for security grade.
 */
export function getSecurityGradeLabel(grade: SecurityReport["grade"]): string {
  const labels: Record<string, string> = {
    A: "안전",
    B: "양호",
    C: "주의 필요",
    D: "위험",
    F: "심각",
  };
  return labels[grade] ?? "알 수 없음";
}
