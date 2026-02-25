/**
 * Automated AI Code Review Pipeline
 * Analyzes code quality, security, performance, maintainability, and accessibility
 * without calling external AI APIs. Uses static analysis patterns similar to ESLint rules.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReviewIssue {
  file: string;
  line?: number;
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface ReviewReport {
  issues: ReviewIssue[];
  score: number; // 0-100
  summary: string;
  categories: {
    security: { score: number; issues: number };
    performance: { score: number; issues: number };
    maintainability: { score: number; issues: number };
    accessibility: { score: number; issues: number };
  };
}

type Category = "security" | "performance" | "maintainability" | "accessibility";

interface ReviewRule {
  id: string;
  category: Category;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  /** Which file extensions this rule applies to. Empty = all. */
  fileTypes: string[];
  /** Check function: returns line numbers where issue is found, or true/false for file-level check. */
  check: (content: string, filename: string) => number[] | boolean;
}

// ── Helper: get line number(s) of a regex match ────────────────────────────────

function matchLines(content: string, regex: RegExp): number[] {
  const lines = content.split("\n");
  const matches: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      matches.push(i + 1);
    }
  }
  return matches;
}

// ── Helper: check nesting depth ────────────────────────────────────────────────

function findDeepNesting(content: string, maxDepth: number): number[] {
  const lines = content.split("\n");
  const deepLines: number[] = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const opens = (lines[i].match(/{/g) || []).length;
    const closes = (lines[i].match(/}/g) || []).length;
    depth += opens - closes;
    if (depth > maxDepth) {
      deepLines.push(i + 1);
    }
  }
  return deepLines;
}

// ── Helper: find long functions ────────────────────────────────────────────────

function findLongFunctions(content: string, maxLines: number): number[] {
  const lines = content.split("\n");
  const results: number[] = [];
  const funcStart = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/;
  let funcStartLine = -1;
  let braceDepth = 0;
  let inFunc = false;

  for (let i = 0; i < lines.length; i++) {
    if (!inFunc && funcStart.test(lines[i])) {
      funcStartLine = i + 1;
      inFunc = true;
      braceDepth = 0;
    }
    if (inFunc) {
      braceDepth += (lines[i].match(/{/g) || []).length;
      braceDepth -= (lines[i].match(/}/g) || []).length;
      if (braceDepth <= 0 && funcStartLine > 0) {
        const funcLength = (i + 1) - funcStartLine;
        if (funcLength > maxLines) {
          results.push(funcStartLine);
        }
        inFunc = false;
        funcStartLine = -1;
      }
    }
  }
  return results;
}

// ── Rule definitions (40+ rules) ───────────────────────────────────────────────

const RULES: ReviewRule[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY (12 rules)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "sec-eval",
    category: "security",
    severity: "error",
    message: "eval() 사용이 감지되었습니다. 코드 인젝션 위험이 있습니다.",
    suggestion: "eval() 대신 JSON.parse() 또는 Function constructor를 안전하게 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts", "html"],
    check: (content) => matchLines(content, /\beval\s*\(/),
  },
  {
    id: "sec-innerhtml",
    category: "security",
    severity: "error",
    message: "innerHTML에 동적 값 할당이 감지되었습니다. XSS 공격 벡터가 될 수 있습니다.",
    suggestion: "textContent 또는 DOM API (createElement/appendChild)를 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts", "html"],
    check: (content) => matchLines(content, /\.innerHTML\s*[=+]/),
  },
  {
    id: "sec-document-write",
    category: "security",
    severity: "error",
    message: "document.write() 사용이 감지되었습니다.",
    suggestion: "DOM API를 사용하여 콘텐츠를 삽입하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts", "html"],
    check: (content) => matchLines(content, /document\.write\s*\(/),
  },
  {
    id: "sec-hardcoded-secret",
    category: "security",
    severity: "error",
    message: "하드코딩된 API 키 또는 시크릿이 감지되었습니다.",
    suggestion: "환경변수나 Secrets Vault에 민감 정보를 저장하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts", "html", "json"],
    check: (content) => matchLines(content, /(?:api[_-]?key|secret|password|token|auth)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i),
  },
  {
    id: "sec-sql-injection",
    category: "security",
    severity: "error",
    message: "SQL 인젝션 패턴이 감지되었습니다. 문자열 연결로 SQL 쿼리를 구성하고 있습니다.",
    suggestion: "파라미터화된 쿼리(prepared statements)를 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /(?:SELECT|INSERT|UPDATE|DELETE|DROP)[\s\S]*?\+\s*(?:req\.|params\.|body\.|query\.|\$\{)/i),
  },
  {
    id: "sec-xss-href",
    category: "security",
    severity: "warning",
    message: "href에 javascript: 프로토콜 사용이 감지되었습니다.",
    suggestion: "javascript: URL은 XSS 벡터입니다. 이벤트 핸들러를 사용하세요.",
    autoFixable: false,
    fileTypes: ["html", "js", "ts"],
    check: (content) => matchLines(content, /href\s*=\s*['"]javascript:/i),
  },
  {
    id: "sec-open-redirect",
    category: "security",
    severity: "warning",
    message: "사용자 입력 기반 리다이렉트가 감지되었습니다. Open Redirect 위험이 있습니다.",
    suggestion: "화이트리스트 기반 리다이렉트를 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /(?:window\.location|location\.href)\s*=\s*(?:req\.|params\.|query\.|searchParams)/),
  },
  {
    id: "sec-new-function",
    category: "security",
    severity: "warning",
    message: "new Function() 사용이 감지되었습니다.",
    suggestion: "동적 코드 실행은 보안 위험이 있습니다. 정적 코드를 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /new\s+Function\s*\(/),
  },
  {
    id: "sec-postmessage-origin",
    category: "security",
    severity: "warning",
    message: "postMessage에서 targetOrigin으로 '*'을 사용하고 있습니다.",
    suggestion: "특정 오리진을 지정하여 메시지 유출을 방지하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /postMessage\([^)]*,\s*['"][*]['"]\s*\)/),
  },
  {
    id: "sec-unsafe-regex",
    category: "security",
    severity: "warning",
    message: "잠재적으로 위험한 정규표현식이 감지되었습니다 (ReDoS 위험).",
    suggestion: "반복되는 그룹 내 반복 패턴을 피하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /new\s+RegExp\([^)]*\(\.\*\)\+/),
  },
  {
    id: "sec-cors-wildcard",
    category: "security",
    severity: "warning",
    message: "CORS에서 와일드카드('*') Origin을 허용하고 있습니다.",
    suggestion: "특정 도메인만 허용하도록 CORS 설정을 변경하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /Access-Control-Allow-Origin['":\s]*['"]\*/),
  },
  {
    id: "sec-dangerouslysetinnerhtml",
    category: "security",
    severity: "error",
    message: "React dangerouslySetInnerHTML 사용이 감지되었습니다.",
    suggestion: "DOMPurify 등의 라이브러리로 HTML을 살균(sanitize)하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /dangerouslySetInnerHTML/),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFORMANCE (11 rules)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "perf-dom-in-loop",
    category: "performance",
    severity: "warning",
    message: "루프 내에서 DOM 조작이 감지되었습니다.",
    suggestion: "DocumentFragment를 사용하거나 루프 외부에서 DOM을 일괄 업데이트하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      let inLoop = false;
      let braceDepth = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/\b(?:for|while|forEach|map)\b/.test(lines[i])) inLoop = true;
        if (inLoop) {
          braceDepth += (lines[i].match(/{/g) || []).length;
          braceDepth -= (lines[i].match(/}/g) || []).length;
          if (/(?:appendChild|insertBefore|removeChild|replaceChild|document\.createElement)\s*\(/.test(lines[i])) {
            results.push(i + 1);
          }
          if (braceDepth <= 0) { inLoop = false; braceDepth = 0; }
        }
      }
      return results;
    },
  },
  {
    id: "perf-sync-xhr",
    category: "performance",
    severity: "error",
    message: "동기 XMLHttpRequest가 감지되었습니다. UI를 차단합니다.",
    suggestion: "fetch() 또는 async/await를 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /\.open\s*\(\s*['"][^'"]*['"]\s*,\s*['"][^'"]*['"]\s*,\s*false\s*\)/),
  },
  {
    id: "perf-missing-key",
    category: "performance",
    severity: "warning",
    message: "리스트 렌더링에서 key prop이 누락되었을 수 있습니다.",
    suggestion: "map()으로 JSX를 렌더링할 때 고유한 key prop을 추가하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /\.map\s*\([^)]*\)\s*=>\s*(?:<\w+(?:\s+(?!key\b)[\w-]+=))/),
  },
  {
    id: "perf-large-inline-style",
    category: "performance",
    severity: "info",
    message: "대규모 인라인 스타일이 감지되었습니다.",
    suggestion: "CSS 클래스를 사용하여 스타일을 분리하면 캐싱과 재사용이 가능합니다.",
    autoFixable: false,
    fileTypes: ["html"],
    check: (content) => matchLines(content, /style=["'][^"']{150,}["']/),
  },
  {
    id: "perf-console-log",
    category: "performance",
    severity: "info",
    message: "console.log()가 프로덕션 코드에 남아있습니다.",
    suggestion: "프로덕션 배포 전 console 문을 제거하거나 조건부로 사용하세요.",
    autoFixable: true,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /console\.\w+\s*\(/),
  },
  {
    id: "perf-setinterval-leak",
    category: "performance",
    severity: "warning",
    message: "setInterval이 clearInterval 없이 사용되고 있습니다. 메모리 누수 위험.",
    suggestion: "컴포넌트 언마운트 시 clearInterval()을 호출하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const hasSetInterval = /setInterval\s*\(/.test(content);
      const hasClearInterval = /clearInterval\s*\(/.test(content);
      return hasSetInterval && !hasClearInterval ? matchLines(content, /setInterval\s*\(/) : [];
    },
  },
  {
    id: "perf-no-lazy-image",
    category: "performance",
    severity: "info",
    message: "이미지에 loading='lazy' 속성이 없습니다.",
    suggestion: "스크롤 아래의 이미지에 loading='lazy'를 추가하여 초기 로딩을 개선하세요.",
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/<img\b/i.test(lines[i]) && !/loading\s*=/i.test(lines[i])) {
          results.push(i + 1);
        }
      }
      return results;
    },
  },
  {
    id: "perf-no-async-script",
    category: "performance",
    severity: "info",
    message: "외부 스크립트에 async/defer 속성이 없습니다.",
    suggestion: "외부 스크립트에 async 또는 defer를 추가하여 파싱 차단을 방지하세요.",
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/<script\s+[^>]*src=/i.test(lines[i]) && !/(?:async|defer)/i.test(lines[i])) {
          results.push(i + 1);
        }
      }
      return results;
    },
  },
  {
    id: "perf-reflow-read-write",
    category: "performance",
    severity: "warning",
    message: "레이아웃 쓰래싱(thrashing) 패턴이 감지되었습니다.",
    suggestion: "DOM 읽기/쓰기를 분리하거나 requestAnimationFrame을 사용하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /(?:offsetWidth|offsetHeight|clientWidth|clientHeight|getBoundingClientRect)\b.*\.style\./),
  },
  {
    id: "perf-star-import",
    category: "performance",
    severity: "info",
    message: "와일드카드 import(import *)가 감지되었습니다. 트리셰이킹을 방해할 수 있습니다.",
    suggestion: "필요한 모듈만 named import하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /import\s+\*\s+as\s+/),
  },
  {
    id: "perf-render-in-render",
    category: "performance",
    severity: "warning",
    message: "렌더 함수 내에서 컴포넌트를 정의하고 있습니다.",
    suggestion: "컴포넌트를 별도로 분리하여 불필요한 재렌더를 방지하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      let inReturn = false;
      for (let i = 0; i < lines.length; i++) {
        if (/\breturn\s*\(/.test(lines[i])) inReturn = true;
        if (inReturn && /(?:function\s+[A-Z]|const\s+[A-Z]\w+\s*=\s*(?:\(|function))/.test(lines[i])) {
          results.push(i + 1);
        }
        if (inReturn && lines[i].includes(");")) inReturn = false;
      }
      return results;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MAINTAINABILITY (11 rules)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "maint-long-function",
    category: "maintainability",
    severity: "warning",
    message: "50줄이 넘는 함수가 감지되었습니다.",
    suggestion: "함수를 더 작은 단위로 분리하여 가독성을 높이세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => findLongFunctions(content, 50),
  },
  {
    id: "maint-deep-nesting",
    category: "maintainability",
    severity: "warning",
    message: "4단계 이상의 중첩이 감지되었습니다.",
    suggestion: "조기 반환(early return), guard 조건, 또는 함수 분리를 고려하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => findDeepNesting(content, 4),
  },
  {
    id: "maint-magic-number",
    category: "maintainability",
    severity: "info",
    message: "매직 넘버(설명 없는 숫자 리터럴)가 감지되었습니다.",
    suggestion: "의미 있는 상수명으로 추출하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments, imports, common harmless numbers
        if (/^\s*\/\//.test(line) || /^\s*\*/.test(line) || /import\s/.test(line)) continue;
        // Find numbers > 1 that aren't common (0, 1, 2, 100, indices)
        const matches = line.match(/\b(?<!\.)(\d{3,})\b/g);
        if (matches) {
          const nonCommon = matches.filter(n => !["100", "1000", "1024", "200", "300", "400", "404", "500"].includes(n));
          if (nonCommon.length > 0) results.push(i + 1);
        }
      }
      return results;
    },
  },
  {
    id: "maint-todo-comment",
    category: "maintainability",
    severity: "info",
    message: "TODO/FIXME/HACK 주석이 남아있습니다.",
    suggestion: "배포 전 TODO 항목을 처리하거나 이슈 트래커에 등록하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts", "html", "css"],
    check: (content) => matchLines(content, /\/\/\s*(?:TODO|FIXME|HACK|XXX|WORKAROUND)\b/i),
  },
  {
    id: "maint-dead-code",
    category: "maintainability",
    severity: "info",
    message: "주석 처리된 코드 블록이 감지되었습니다 (dead code).",
    suggestion: "사용하지 않는 코드는 삭제하세요. Git 이력에서 복구 가능합니다.",
    autoFixable: true,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      let commentBlock = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^\s*\/\/.*[;{()}]/.test(lines[i])) {
          commentBlock++;
          if (commentBlock >= 3) results.push(i + 1 - 2);
        } else {
          commentBlock = 0;
        }
      }
      return results;
    },
  },
  {
    id: "maint-no-typescript",
    category: "maintainability",
    severity: "info",
    message: "TypeScript를 사용하지 않는 JavaScript 파일입니다.",
    suggestion: "TypeScript로 전환하여 타입 안정성을 확보하세요.",
    autoFixable: false,
    fileTypes: ["js"],
    check: (_content, filename) => filename.endsWith(".js"),
  },
  {
    id: "maint-var-usage",
    category: "maintainability",
    severity: "warning",
    message: "var 키워드 사용이 감지되었습니다.",
    suggestion: "const 또는 let을 사용하여 블록 스코프를 보장하세요.",
    autoFixable: true,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /\bvar\s+\w/),
  },
  {
    id: "maint-duplicate-string",
    category: "maintainability",
    severity: "info",
    message: "동일한 문자열 리터럴이 3회 이상 반복됩니다.",
    suggestion: "상수로 추출하여 유지보수성을 높이세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const strMap = new Map<string, number[]>();
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(/['"][^'"]{6,}['"]/g);
        if (matches) {
          for (const m of matches) {
            if (!strMap.has(m)) strMap.set(m, []);
            strMap.get(m)!.push(i + 1);
          }
        }
      }
      const results: number[] = [];
      for (const [, lns] of strMap) {
        if (lns.length >= 3) results.push(lns[0]);
      }
      return results;
    },
  },
  {
    id: "maint-empty-catch",
    category: "maintainability",
    severity: "warning",
    message: "빈 catch 블록이 감지되었습니다.",
    suggestion: "에러를 로깅하거나 적절히 처리하세요.",
    autoFixable: false,
    fileTypes: ["js", "ts"],
    check: (content) => matchLines(content, /catch\s*\([^)]*\)\s*\{\s*\}/),
  },
  {
    id: "maint-any-type",
    category: "maintainability",
    severity: "warning",
    message: "TypeScript에서 'any' 타입이 사용되었습니다.",
    suggestion: "구체적인 타입을 정의하여 타입 안정성을 확보하세요.",
    autoFixable: false,
    fileTypes: ["ts"],
    check: (content) => matchLines(content, /:\s*any\b/),
  },
  {
    id: "maint-no-strict-eq",
    category: "maintainability",
    severity: "warning",
    message: "비엄격 동등 비교(== 또는 !=)가 사용되었습니다.",
    suggestion: "=== 또는 !==를 사용하여 타입 강제 변환 버그를 방지하세요.",
    autoFixable: true,
    fileTypes: ["js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match == or != but not === or !==
        if (/[^!=]==[^=]/.test(line) || /[^!]!=[^=]/.test(line)) {
          // Exclude comments
          if (!/^\s*\/\//.test(line) && !/^\s*\*/.test(line)) {
            results.push(i + 1);
          }
        }
      }
      return results;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY (10 rules)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "a11y-missing-alt",
    category: "accessibility",
    severity: "error",
    message: "이미지에 alt 속성이 없습니다.",
    suggestion: "모든 <img> 태그에 의미 있는 alt 텍스트를 추가하세요.",
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/<img\b/i.test(lines[i]) && !/alt\s*=/i.test(lines[i])) {
          results.push(i + 1);
        }
      }
      return results;
    },
  },
  {
    id: "a11y-missing-lang",
    category: "accessibility",
    severity: "error",
    message: "<html> 태그에 lang 속성이 없습니다.",
    suggestion: '<html lang="ko"> 형태로 언어를 명시하세요.',
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      if (/<html\b/i.test(content) && !/<html\s[^>]*lang\s*=/i.test(content)) {
        return matchLines(content, /<html\b/i);
      }
      return [];
    },
  },
  {
    id: "a11y-missing-label",
    category: "accessibility",
    severity: "warning",
    message: "폼 요소에 연결된 <label>이 없습니다.",
    suggestion: "각 입력 필드에 <label for='id'>를 연결하거나 aria-label을 추가하세요.",
    autoFixable: false,
    fileTypes: ["html"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/<(?:input|select|textarea)\b/i.test(lines[i]) && !/aria-label/i.test(lines[i])) {
          // Check if there's a label wrapping or a label nearby with matching for/id
          const id = lines[i].match(/id\s*=\s*['"]([^'"]+)['"]/i);
          if (id) {
            const hasLabel = new RegExp(`for\\s*=\\s*['"]${id[1]}['"]`, "i").test(content);
            if (!hasLabel) results.push(i + 1);
          } else {
            // No id and no aria-label — check if wrapped in label
            if (i > 0 && !/<label\b/i.test(lines[i - 1]) && !/<label\b/i.test(lines[i])) {
              results.push(i + 1);
            }
          }
        }
      }
      return results;
    },
  },
  {
    id: "a11y-no-aria-interactive",
    category: "accessibility",
    severity: "warning",
    message: "클릭 이벤트가 있는 비-인터랙티브 요소에 ARIA 역할이 없습니다.",
    suggestion: 'role="button" 과 tabIndex={0}을 추가하거나 <button>을 사용하세요.',
    autoFixable: false,
    fileTypes: ["html", "js", "ts"],
    check: (content) => {
      const lines = content.split("\n");
      const results: number[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/(?:onClick|onclick)\s*=/.test(lines[i]) && /<(?:div|span|p|li)\b/i.test(lines[i])) {
          if (!/role\s*=/.test(lines[i]) && !/tabIndex|tabindex/.test(lines[i])) {
            results.push(i + 1);
          }
        }
      }
      return results;
    },
  },
  {
    id: "a11y-color-contrast",
    category: "accessibility",
    severity: "info",
    message: "색상만으로 정보를 전달하는 패턴이 감지되었습니다.",
    suggestion: "색맹 사용자를 위해 아이콘, 텍스트, 패턴 등 추가 시각적 구분을 제공하세요.",
    autoFixable: false,
    fileTypes: ["css"],
    check: (content) => {
      // Heuristic: color-only indicators often use very similar colors without text
      const hasRedGreen = /color:\s*(?:#(?:ff0000|00ff00|f00|0f0)|red|green)\b/i.test(content);
      return hasRedGreen ? matchLines(content, /color:\s*(?:#(?:ff0000|00ff00|f00|0f0)|red|green)\b/i) : [];
    },
  },
  {
    id: "a11y-missing-viewport",
    category: "accessibility",
    severity: "warning",
    message: "viewport meta 태그가 없습니다.",
    suggestion: '<meta name="viewport" content="width=device-width, initial-scale=1.0">를 추가하세요.',
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      if (/<head\b/i.test(content) && !/name=["']viewport["']/i.test(content)) {
        return matchLines(content, /<head\b/i);
      }
      return [];
    },
  },
  {
    id: "a11y-missing-title",
    category: "accessibility",
    severity: "warning",
    message: "<title> 태그가 없거나 비어있습니다.",
    suggestion: "페이지에 의미 있는 <title>을 추가하세요.",
    autoFixable: true,
    fileTypes: ["html"],
    check: (content) => {
      if (/<head\b/i.test(content)) {
        if (!/<title\b/i.test(content) || /<title\s*>\s*<\/title>/i.test(content)) {
          return matchLines(content, /<head\b/i);
        }
      }
      return [];
    },
  },
  {
    id: "a11y-tabindex-positive",
    category: "accessibility",
    severity: "warning",
    message: "양수 tabindex가 사용되었습니다.",
    suggestion: "tabindex는 0 또는 -1만 사용하세요. 양수 tabindex는 포커스 순서를 교란합니다.",
    autoFixable: false,
    fileTypes: ["html", "js", "ts"],
    check: (content) => matchLines(content, /tabindex\s*=\s*['"]?[2-9]\d*/i),
  },
  {
    id: "a11y-autofocus",
    category: "accessibility",
    severity: "info",
    message: "autofocus 속성이 사용되었습니다.",
    suggestion: "autofocus는 스크린리더 사용자를 혼란시킬 수 있습니다. 필요성을 재검토하세요.",
    autoFixable: false,
    fileTypes: ["html"],
    check: (content) => matchLines(content, /\bautofocus\b/i),
  },
  {
    id: "a11y-heading-order",
    category: "accessibility",
    severity: "warning",
    message: "제목 레벨이 순서대로 사용되지 않았습니다 (예: h1 다음 h3).",
    suggestion: "제목을 h1 -> h2 -> h3 순서대로 사용하세요.",
    autoFixable: false,
    fileTypes: ["html"],
    check: (content) => {
      const headings = [...content.matchAll(/<h([1-6])\b/gi)];
      if (headings.length < 2) return [];
      const results: number[] = [];
      for (let i = 1; i < headings.length; i++) {
        const prev = parseInt(headings[i - 1][1]);
        const curr = parseInt(headings[i][1]);
        if (curr > prev + 1) {
          // Find line of this heading
          const idx = content.indexOf(headings[i][0], headings[i].index);
          const line = content.substring(0, idx).split("\n").length;
          results.push(line);
        }
      }
      return results;
    },
  },
];

// ── File extension helpers ─────────────────────────────────────────────────────

function getExt(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function ruleAppliesToFile(rule: ReviewRule, filename: string): boolean {
  if (rule.fileTypes.length === 0) return true;
  const ext = getExt(filename);
  return rule.fileTypes.includes(ext);
}

// ── Main pipeline ──────────────────────────────────────────────────────────────

export function runAutoReview(
  files: Record<string, { content: string }>,
): ReviewReport {
  const issues: ReviewIssue[] = [];

  // Run each rule against each file
  for (const [filename, file] of Object.entries(files)) {
    for (const rule of RULES) {
      if (!ruleAppliesToFile(rule, filename)) continue;

      const result = rule.check(file.content, filename);

      if (typeof result === "boolean") {
        if (result) {
          issues.push({
            file: filename,
            severity: rule.severity,
            rule: rule.id,
            message: rule.message,
            suggestion: rule.suggestion,
            autoFixable: rule.autoFixable,
          });
        }
      } else if (Array.isArray(result) && result.length > 0) {
        // Group nearby lines to avoid spam (within 3 lines = 1 issue)
        const grouped = groupNearbyLines(result, 3);
        for (const line of grouped) {
          issues.push({
            file: filename,
            line,
            severity: rule.severity,
            rule: rule.id,
            message: rule.message,
            suggestion: rule.suggestion,
            autoFixable: rule.autoFixable,
          });
        }
      }
    }
  }

  // Calculate scores
  const catIssues = {
    security: issues.filter(i => RULES.find(r => r.id === i.rule)?.category === "security"),
    performance: issues.filter(i => RULES.find(r => r.id === i.rule)?.category === "performance"),
    maintainability: issues.filter(i => RULES.find(r => r.id === i.rule)?.category === "maintainability"),
    accessibility: issues.filter(i => RULES.find(r => r.id === i.rule)?.category === "accessibility"),
  };

  function calcScore(catIssueList: ReviewIssue[]): number {
    let deductions = 0;
    for (const issue of catIssueList) {
      if (issue.severity === "error") deductions += 15;
      else if (issue.severity === "warning") deductions += 7;
      else deductions += 3;
    }
    return Math.max(0, Math.min(100, 100 - deductions));
  }

  const categories = {
    security: { score: calcScore(catIssues.security), issues: catIssues.security.length },
    performance: { score: calcScore(catIssues.performance), issues: catIssues.performance.length },
    maintainability: { score: calcScore(catIssues.maintainability), issues: catIssues.maintainability.length },
    accessibility: { score: calcScore(catIssues.accessibility), issues: catIssues.accessibility.length },
  };

  const overallScore = Math.round(
    (categories.security.score * 0.35) +
    (categories.performance.score * 0.25) +
    (categories.maintainability.score * 0.20) +
    (categories.accessibility.score * 0.20),
  );

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;
  const autoFixCount = issues.filter(i => i.autoFixable).length;

  let summary = "";
  if (overallScore >= 90) {
    summary = `우수한 코드 품질입니다! ${issues.length}개의 소소한 개선점이 있습니다.`;
  } else if (overallScore >= 70) {
    summary = `양호한 수준이나 ${errorCount}개의 오류와 ${warningCount}개의 경고가 있습니다. 주요 이슈를 해결하면 코드 품질이 크게 향상됩니다.`;
  } else if (overallScore >= 50) {
    summary = `개선이 필요합니다. ${errorCount}개의 심각한 문제가 감지되었습니다. 보안과 성능 이슈를 우선 해결하세요.`;
  } else {
    summary = `코드 품질 점검이 시급합니다. ${errorCount}개의 에러, ${warningCount}개의 경고가 발견되었습니다. 보안 취약점을 즉시 수정하세요.`;
  }
  if (autoFixCount > 0) {
    summary += ` (${autoFixCount}개의 이슈는 자동 수정 가능)`;
  }

  return {
    issues: issues.sort((a, b) => {
      const sevOrder = { error: 0, warning: 1, info: 2 };
      return sevOrder[a.severity] - sevOrder[b.severity];
    }),
    score: overallScore,
    summary,
    categories,
  };
}

// ── Helper: group nearby line numbers ──────────────────────────────────────────

function groupNearbyLines(lines: number[], threshold: number): number[] {
  if (lines.length === 0) return [];
  const sorted = [...new Set(lines)].sort((a, b) => a - b);
  const result: number[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > threshold) {
      result.push(sorted[i]);
    }
  }
  return result;
}

// ── Auto-fix helpers ───────────────────────────────────────────────────────────

export interface AutoFix {
  file: string;
  rule: string;
  description: string;
  apply: (content: string) => string;
}

export function getAutoFixes(report: ReviewReport, files: Record<string, { content: string }>): AutoFix[] {
  const fixes: AutoFix[] = [];
  const fixableIssues = report.issues.filter(i => i.autoFixable);

  for (const issue of fixableIssues) {
    const file = files[issue.file];
    if (!file) continue;

    switch (issue.rule) {
      case "perf-console-log":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "console 문 제거",
          apply: (content) => content.replace(/^\s*console\.\w+\s*\([^)]*\);?\s*$/gm, ""),
        });
        break;
      case "maint-var-usage":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "var를 let으로 변환",
          apply: (content) => content.replace(/\bvar\s+/g, "let "),
        });
        break;
      case "a11y-missing-alt":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "이미지에 빈 alt 속성 추가",
          apply: (content) => content.replace(/<img(?![^>]*alt\s*=)([^>]*)>/gi, '<img alt=""$1>'),
        });
        break;
      case "a11y-missing-lang":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: '<html>에 lang="ko" 추가',
          apply: (content) => content.replace(/<html(?![^>]*lang\s*=)([^>]*)>/i, '<html lang="ko"$1>'),
        });
        break;
      case "a11y-missing-viewport":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "viewport meta 태그 추가",
          apply: (content) => content.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />'),
        });
        break;
      case "a11y-missing-title":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "<title> 태그 추가",
          apply: (content) => {
            if (/<title\s*>\s*<\/title>/i.test(content)) {
              return content.replace(/<title\s*>\s*<\/title>/i, "<title>My App</title>");
            }
            return content.replace(/<head>/i, "<head>\n  <title>My App</title>");
          },
        });
        break;
      case "perf-no-lazy-image":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: '이미지에 loading="lazy" 추가',
          apply: (content) => content.replace(/<img(?![^>]*loading\s*=)([^>]*)>/gi, '<img loading="lazy"$1>'),
        });
        break;
      case "perf-no-async-script":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "외부 스크립트에 defer 추가",
          apply: (content) => content.replace(/<script(?![^>]*(?:async|defer))(\s+[^>]*src=[^>]*)>/gi, "<script defer$1>"),
        });
        break;
      case "maint-no-strict-eq":
        fixes.push({
          file: issue.file,
          rule: issue.rule,
          description: "== 를 === 로, != 를 !== 로 변환",
          apply: (content) => content
            .replace(/([^!=])={2}([^=])/g, "$1===$2")
            .replace(/([^!])!={1}([^=])/g, "$1!==$2"),
        });
        break;
      case "maint-dead-code":
        // Skip — too risky for auto-fix without more context
        break;
    }
  }

  // Deduplicate by file + rule
  const seen = new Set<string>();
  return fixes.filter(f => {
    const key = `${f.file}:${f.rule}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
