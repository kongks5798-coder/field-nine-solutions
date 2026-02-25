// ============================================================================
// performanceProfiler.ts — Lighthouse-style static performance profiler
// Analyzes HTML/CSS/JS files for performance, accessibility, best practices,
// and SEO issues without making network requests.
// ============================================================================

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface PerformanceScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  overall: number;
}

export interface PerformanceIssue {
  category: 'performance' | 'accessibility' | 'bestPractices' | 'seo';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
  lineRef?: number;
}

export interface PerformanceReport {
  scores: PerformanceScore;
  issues: PerformanceIssue[];
  grade: string;
  summary: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const SEVERITY_PENALTY: Record<PerformanceIssue['severity'], number> = {
  critical: 15,
  warning: 7,
  info: 2,
};

const CATEGORY_WEIGHTS: Record<keyof Omit<PerformanceScore, 'overall'>, number> = {
  performance: 0.35,
  accessibility: 0.25,
  bestPractices: 0.20,
  seo: 0.20,
};

const DEPRECATED_TAGS = [
  'center', 'font', 'marquee', 'blink', 'big', 'strike', 'tt', 'frameset', 'frame',
];

function countMatches(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function findLineNumber(content: string, searchStr: string): number | undefined {
  const idx = content.indexOf(searchStr);
  if (idx === -1) return undefined;
  return content.substring(0, idx).split('\n').length;
}

function isHtmlFile(filename: string): boolean {
  return /\.(html?|htm)$/i.test(filename);
}

function isCssFile(filename: string): boolean {
  return /\.css$/i.test(filename);
}

function isJsFile(filename: string): boolean {
  return /\.(js|jsx|ts|tsx)$/i.test(filename);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeGrade(overall: number): string {
  if (overall >= 90) return 'A';
  if (overall >= 80) return 'B';
  if (overall >= 70) return 'C';
  if (overall >= 50) return 'D';
  return 'F';
}

/* ─── Performance Checks ────────────────────────────────────────────────── */

function checkPerformance(
  filename: string,
  content: string,
  issues: PerformanceIssue[],
): void {
  // Large inline styles (>5KB)
  const inlineStyleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  for (const block of inlineStyleMatches) {
    if (block.length > 5120) {
      issues.push({
        category: 'performance',
        severity: 'warning',
        message: `Large inline <style> block (${(block.length / 1024).toFixed(1)}KB) in ${filename}`,
        suggestion: 'Extract large CSS into external stylesheets for better caching and parallel loading.',
        lineRef: findLineNumber(content, block.substring(0, 30)),
      });
    }
  }

  // Large inline CSS (>10KB total)
  let totalInlineCss = 0;
  for (const block of inlineStyleMatches) {
    totalInlineCss += block.length;
  }
  if (totalInlineCss > 10240) {
    issues.push({
      category: 'performance',
      severity: 'critical',
      message: `Total inline CSS exceeds 10KB (${(totalInlineCss / 1024).toFixed(1)}KB) in ${filename}`,
      suggestion: 'Move CSS to external files to enable browser caching and reduce HTML payload.',
    });
  }

  // Too many DOM elements
  if (isHtmlFile(filename)) {
    const tagCount = countMatches(content, /<[a-z][a-z0-9]*[\s>]/gi);
    if (tagCount > 1500) {
      issues.push({
        category: 'performance',
        severity: 'critical',
        message: `Excessive DOM elements (~${tagCount}) in ${filename}`,
        suggestion: 'Reduce DOM complexity. Consider virtualizing long lists or lazy-loading sections.',
      });
    } else if (tagCount > 800) {
      issues.push({
        category: 'performance',
        severity: 'warning',
        message: `High DOM element count (~${tagCount}) in ${filename}`,
        suggestion: 'Consider simplifying the DOM structure to improve rendering performance.',
      });
    }
  }

  // Unoptimized images — missing width/height
  const imgTags = content.match(/<img\b[^>]*>/gi) || [];
  for (const img of imgTags) {
    const hasWidth = /\bwidth\s*=/i.test(img);
    const hasHeight = /\bheight\s*=/i.test(img);
    if (!hasWidth || !hasHeight) {
      issues.push({
        category: 'performance',
        severity: 'warning',
        message: `Image missing explicit width/height in ${filename}`,
        suggestion: 'Set width and height attributes on <img> to prevent layout shifts (CLS).',
        lineRef: findLineNumber(content, img),
      });
    }

    // Missing lazy loading
    const hasLazy = /\bloading\s*=\s*["']lazy["']/i.test(img);
    const isAboveFold = content.indexOf(img) < content.length * 0.3;
    if (!hasLazy && !isAboveFold) {
      issues.push({
        category: 'performance',
        severity: 'info',
        message: `Image may benefit from lazy loading in ${filename}`,
        suggestion: 'Add loading="lazy" to below-the-fold images to defer offscreen image loads.',
        lineRef: findLineNumber(content, img),
      });
    }
  }

  // Blocking scripts (no defer/async)
  const scriptTags = content.match(/<script\b[^>]*src\s*=[^>]*>/gi) || [];
  for (const script of scriptTags) {
    const hasDefer = /\bdefer\b/i.test(script);
    const hasAsync = /\basync\b/i.test(script);
    const hasModule = /\btype\s*=\s*["']module["']/i.test(script);
    if (!hasDefer && !hasAsync && !hasModule) {
      issues.push({
        category: 'performance',
        severity: 'warning',
        message: `Render-blocking <script> without defer/async in ${filename}`,
        suggestion: 'Add defer or async attribute to prevent blocking the HTML parser.',
        lineRef: findLineNumber(content, script),
      });
    }
  }

  // No minification detection (for JS/CSS files)
  if ((isJsFile(filename) || isCssFile(filename)) && content.length > 1024) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
    const avgLineLength =
      nonEmptyLines.reduce((sum, l) => sum + l.length, 0) / (nonEmptyLines.length || 1);
    // Minified code typically has very long lines (>200 chars avg)
    // Unminified code typically has shorter lines
    if (avgLineLength < 120 && nonEmptyLines.length > 20 && content.length > 4096) {
      issues.push({
        category: 'performance',
        severity: 'info',
        message: `${filename} does not appear to be minified (${(content.length / 1024).toFixed(1)}KB)`,
        suggestion: 'Minify production CSS/JS to reduce file size and improve load times.',
      });
    }
  }

  // Too many HTTP requests (script + link tags)
  if (isHtmlFile(filename)) {
    const externalScripts = countMatches(content, /<script\b[^>]*src\s*=/gi);
    const externalStyles = countMatches(content, /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*/gi);
    const totalRequests = externalScripts + externalStyles;
    if (totalRequests > 15) {
      issues.push({
        category: 'performance',
        severity: 'critical',
        message: `Too many external resources (${totalRequests} script/stylesheet tags) in ${filename}`,
        suggestion: 'Bundle resources to reduce HTTP requests. Consider code-splitting for large apps.',
      });
    } else if (totalRequests > 8) {
      issues.push({
        category: 'performance',
        severity: 'warning',
        message: `Many external resources (${totalRequests} script/stylesheet tags) in ${filename}`,
        suggestion: 'Consider bundling or combining some resources to reduce HTTP overhead.',
      });
    }
  }

  // Missing resource hints
  if (isHtmlFile(filename)) {
    const hasPreload = /rel\s*=\s*["']preload["']/i.test(content);
    const hasPrefetch = /rel\s*=\s*["']prefetch["']/i.test(content);
    const hasPreconnect = /rel\s*=\s*["']preconnect["']/i.test(content);
    if (!hasPreload && !hasPrefetch && !hasPreconnect) {
      const externalCount = countMatches(content, /<(script|link)\b[^>]*(src|href)\s*=\s*["']https?:\/\//gi);
      if (externalCount > 0) {
        issues.push({
          category: 'performance',
          severity: 'info',
          message: `No resource hints (preload/prefetch/preconnect) found in ${filename}`,
          suggestion:
            'Add <link rel="preconnect"> for third-party origins and <link rel="preload"> for critical resources.',
        });
      }
    }
  }
}

/* ─── Accessibility Checks ──────────────────────────────────────────────── */

function checkAccessibility(
  filename: string,
  content: string,
  issues: PerformanceIssue[],
): void {
  if (!isHtmlFile(filename)) return;

  // Missing alt attributes
  const imgsWithoutAlt = content.match(/<img\b(?![^>]*\balt\s*=)[^>]*>/gi) || [];
  for (const img of imgsWithoutAlt) {
    issues.push({
      category: 'accessibility',
      severity: 'critical',
      message: `Image missing alt attribute in ${filename}`,
      suggestion: 'Add descriptive alt text to all images for screen readers. Use alt="" for decorative images.',
      lineRef: findLineNumber(content, img),
    });
  }

  // Missing lang attribute
  const htmlTag = content.match(/<html\b[^>]*>/i);
  if (htmlTag && !/\blang\s*=/i.test(htmlTag[0])) {
    issues.push({
      category: 'accessibility',
      severity: 'critical',
      message: `<html> tag missing lang attribute in ${filename}`,
      suggestion: 'Add lang="en" (or appropriate language) to the <html> element.',
      lineRef: findLineNumber(content, htmlTag[0]),
    });
  }

  // Low color contrast indicators (hardcoded problematic combinations)
  const lowContrastPatterns = [
    { pattern: /color\s*:\s*#?(?:fff(?:fff)?|white)\b.*background(?:-color)?\s*:\s*#?(?:fff(?:fff)?|white)\b/gi, desc: 'white on white' },
    { pattern: /color\s*:\s*#?(?:ccc|ddd|eee|bbb)\b/gi, desc: 'light gray text' },
    { pattern: /color\s*:\s*#?(?:999)\b/gi, desc: 'gray text (#999)' },
  ];
  for (const { pattern, desc } of lowContrastPatterns) {
    if (pattern.test(content)) {
      issues.push({
        category: 'accessibility',
        severity: 'warning',
        message: `Potential low color contrast detected (${desc}) in ${filename}`,
        suggestion: 'Ensure text has at least 4.5:1 contrast ratio against its background (WCAG AA).',
      });
    }
  }

  // Missing form labels
  const inputs = content.match(/<input\b[^>]*>/gi) || [];
  for (const input of inputs) {
    const hasHidden = /type\s*=\s*["']hidden["']/i.test(input);
    const hasSubmit = /type\s*=\s*["']submit["']/i.test(input);
    const hasButton = /type\s*=\s*["']button["']/i.test(input);
    const hasAriaLabel = /aria-label(ledby)?\s*=/i.test(input);
    const hasId = input.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const hasLinkedLabel = hasId && new RegExp(`<label\\b[^>]*for\\s*=\\s*["']${hasId[1]}["']`, 'i').test(content);

    if (!hasHidden && !hasSubmit && !hasButton && !hasAriaLabel && !hasLinkedLabel) {
      issues.push({
        category: 'accessibility',
        severity: 'warning',
        message: `Form input missing associated label in ${filename}`,
        suggestion: 'Associate each input with a <label for="..."> or use aria-label/aria-labelledby.',
        lineRef: findLineNumber(content, input),
      });
    }
  }

  // Missing heading hierarchy
  const headings: number[] = [];
  const headingRegex = /<h([1-6])\b/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(content)) !== null) {
    headings.push(parseInt(headingMatch[1], 10));
  }
  if (headings.length > 1) {
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        issues.push({
          category: 'accessibility',
          severity: 'warning',
          message: `Heading hierarchy skips level (h${headings[i - 1]} to h${headings[i]}) in ${filename}`,
          suggestion: 'Use sequential heading levels (h1 -> h2 -> h3) without skipping for proper document outline.',
        });
        break; // Report once
      }
    }
  }

  // Missing ARIA landmarks
  const hasMain = /<main\b/i.test(content) || /role\s*=\s*["']main["']/i.test(content);
  const hasNav = /<nav\b/i.test(content) || /role\s*=\s*["']navigation["']/i.test(content);
  const hasBody = /<body\b/i.test(content);
  if (hasBody && !hasMain) {
    issues.push({
      category: 'accessibility',
      severity: 'warning',
      message: `Missing <main> landmark in ${filename}`,
      suggestion: 'Wrap primary page content in a <main> element for assistive technology navigation.',
    });
  }
  if (hasBody && !hasNav) {
    issues.push({
      category: 'accessibility',
      severity: 'info',
      message: `Missing <nav> landmark in ${filename}`,
      suggestion: 'Use <nav> elements to identify navigation sections.',
    });
  }

  // No skip navigation link
  if (hasBody) {
    const hasSkipLink =
      /skip[\s-]*(to[\s-]*)?(main|content|nav)/i.test(content) ||
      /<a\b[^>]*href\s*=\s*["']#(main|content)[^"']*["']/i.test(content);
    if (!hasSkipLink) {
      issues.push({
        category: 'accessibility',
        severity: 'info',
        message: `No skip navigation link found in ${filename}`,
        suggestion: 'Add a "Skip to main content" link at the top of the page for keyboard users.',
      });
    }
  }
}

/* ─── Best Practices Checks ─────────────────────────────────────────────── */

function checkBestPractices(
  filename: string,
  content: string,
  issues: PerformanceIssue[],
): void {
  // console.log left in code
  if (isJsFile(filename) || isHtmlFile(filename)) {
    const consoleMatches = content.match(/\bconsole\s*\.\s*log\s*\(/g) || [];
    if (consoleMatches.length > 0) {
      issues.push({
        category: 'bestPractices',
        severity: 'warning',
        message: `${consoleMatches.length} console.log statement(s) found in ${filename}`,
        suggestion: 'Remove console.log calls before production. Use a proper logging library instead.',
        lineRef: findLineNumber(content, 'console.log'),
      });
    }
  }

  // document.write usage
  if (/\bdocument\s*\.\s*write\s*\(/i.test(content)) {
    issues.push({
      category: 'bestPractices',
      severity: 'critical',
      message: `document.write() detected in ${filename}`,
      suggestion: 'Avoid document.write() as it blocks parsing and can overwrite the entire document.',
      lineRef: findLineNumber(content, 'document.write'),
    });
  }

  // eval() usage
  if (/\beval\s*\(/i.test(content)) {
    // Exclude comments and strings that mention eval in documentation
    const evalInCode = content.match(/(?<!\/\/.*)\beval\s*\(/gm);
    if (evalInCode && evalInCode.length > 0) {
      issues.push({
        category: 'bestPractices',
        severity: 'critical',
        message: `eval() usage detected in ${filename}`,
        suggestion: 'Avoid eval() due to security risks (XSS) and performance issues. Use safer alternatives.',
        lineRef: findLineNumber(content, 'eval('),
      });
    }
  }

  // HTTP mixed content
  if (isHtmlFile(filename)) {
    const httpResources = content.match(/(src|href|action)\s*=\s*["']http:\/\//gi) || [];
    if (httpResources.length > 0) {
      issues.push({
        category: 'bestPractices',
        severity: 'critical',
        message: `${httpResources.length} HTTP (non-HTTPS) resource reference(s) in ${filename}`,
        suggestion: 'Use HTTPS for all external resources to prevent mixed content security warnings.',
        lineRef: findLineNumber(content, 'http://'),
      });
    }
  }

  // Missing meta viewport
  if (isHtmlFile(filename) && /<head\b/i.test(content)) {
    const hasViewport = /name\s*=\s*["']viewport["']/i.test(content);
    if (!hasViewport) {
      issues.push({
        category: 'bestPractices',
        severity: 'critical',
        message: `Missing <meta name="viewport"> in ${filename}`,
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for responsive design.',
      });
    }
  }

  // Deprecated HTML tags
  if (isHtmlFile(filename)) {
    for (const tag of DEPRECATED_TAGS) {
      const regex = new RegExp(`<${tag}\\b`, 'gi');
      if (regex.test(content)) {
        issues.push({
          category: 'bestPractices',
          severity: 'warning',
          message: `Deprecated <${tag}> tag used in ${filename}`,
          suggestion: `Replace <${tag}> with modern CSS equivalents.`,
          lineRef: findLineNumber(content, `<${tag}`),
        });
      }
    }
  }
}

/* ─── SEO Checks ────────────────────────────────────────────────────────── */

function checkSeo(
  filename: string,
  content: string,
  issues: PerformanceIssue[],
): void {
  if (!isHtmlFile(filename)) return;

  // Missing title tag
  const hasTitle = /<title\b[^>]*>[^<]+<\/title>/i.test(content);
  if (!hasTitle) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      message: `Missing or empty <title> tag in ${filename}`,
      suggestion: 'Add a unique, descriptive <title> (50-60 characters) to every page.',
    });
  }

  // Missing meta description
  const hasMetaDesc = /name\s*=\s*["']description["']\s+content\s*=\s*["'][^"']+["']/i.test(content)
    || /content\s*=\s*["'][^"']+["']\s+name\s*=\s*["']description["']/i.test(content);
  if (!hasMetaDesc) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      message: `Missing meta description in ${filename}`,
      suggestion: 'Add <meta name="description" content="..."> (120-160 characters) for search result snippets.',
    });
  }

  // Missing Open Graph tags
  const hasOg = /property\s*=\s*["']og:/i.test(content);
  if (!hasOg) {
    issues.push({
      category: 'seo',
      severity: 'warning',
      message: `Missing Open Graph meta tags in ${filename}`,
      suggestion: 'Add og:title, og:description, og:image, og:url for rich social media previews.',
    });
  }

  // Missing canonical link
  const hasCanonical = /rel\s*=\s*["']canonical["']/i.test(content);
  if (!hasCanonical) {
    issues.push({
      category: 'seo',
      severity: 'warning',
      message: `Missing canonical link in ${filename}`,
      suggestion: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues.',
    });
  }

  // No structured data
  const hasStructuredData =
    /type\s*=\s*["']application\/ld\+json["']/i.test(content) ||
    /itemscope/i.test(content) ||
    /vocab\s*=\s*["']https?:\/\/schema\.org/i.test(content);
  if (!hasStructuredData) {
    issues.push({
      category: 'seo',
      severity: 'info',
      message: `No structured data (JSON-LD / microdata) found in ${filename}`,
      suggestion: 'Add JSON-LD structured data to improve search result appearance with rich snippets.',
    });
  }

  // Missing h1 tag
  const hasH1 = /<h1\b/i.test(content);
  if (!hasH1) {
    issues.push({
      category: 'seo',
      severity: 'warning',
      message: `Missing <h1> tag in ${filename}`,
      suggestion: 'Include exactly one <h1> tag per page that describes the main topic.',
    });
  } else {
    // Multiple h1 tags
    const h1Count = countMatches(content, /<h1\b/gi);
    if (h1Count > 1) {
      issues.push({
        category: 'seo',
        severity: 'info',
        message: `Multiple <h1> tags (${h1Count}) found in ${filename}`,
        suggestion: 'Use a single <h1> per page for clearer content hierarchy.',
      });
    }
  }
}

/* ─── Score Calculation ─────────────────────────────────────────────────── */

function calculateScores(issues: PerformanceIssue[]): PerformanceScore {
  const categoryScores: Record<keyof Omit<PerformanceScore, 'overall'>, number> = {
    performance: 100,
    accessibility: 100,
    bestPractices: 100,
    seo: 100,
  };

  for (const issue of issues) {
    const penalty = SEVERITY_PENALTY[issue.severity];
    categoryScores[issue.category] -= penalty;
  }

  const scores: PerformanceScore = {
    performance: clampScore(categoryScores.performance),
    accessibility: clampScore(categoryScores.accessibility),
    bestPractices: clampScore(categoryScores.bestPractices),
    seo: clampScore(categoryScores.seo),
    overall: 0,
  };

  scores.overall = clampScore(
    scores.performance * CATEGORY_WEIGHTS.performance +
    scores.accessibility * CATEGORY_WEIGHTS.accessibility +
    scores.bestPractices * CATEGORY_WEIGHTS.bestPractices +
    scores.seo * CATEGORY_WEIGHTS.seo,
  );

  return scores;
}

function buildSummary(scores: PerformanceScore, issues: PerformanceIssue[]): string {
  const criticals = issues.filter((i) => i.severity === 'critical').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const infos = issues.filter((i) => i.severity === 'info').length;

  const parts: string[] = [];
  parts.push(`Overall score: ${scores.overall}/100 (Grade: ${computeGrade(scores.overall)}).`);
  parts.push(
    `Performance: ${scores.performance} | Accessibility: ${scores.accessibility} | ` +
    `Best Practices: ${scores.bestPractices} | SEO: ${scores.seo}.`,
  );
  parts.push(`Found ${issues.length} issue(s): ${criticals} critical, ${warnings} warnings, ${infos} informational.`);

  if (criticals > 0) {
    parts.push('Address critical issues first for the biggest improvement.');
  } else if (warnings > 0) {
    parts.push('No critical issues found. Consider addressing warnings to further improve quality.');
  } else {
    parts.push('Great job! Only minor suggestions remain.');
  }

  return parts.join(' ');
}

/* ─── Main Profiler Function ────────────────────────────────────────────── */

export function profilePerformance(
  files: Record<string, { content: string }>,
): PerformanceReport {
  const issues: PerformanceIssue[] = [];

  for (const [filename, { content }] of Object.entries(files)) {
    checkPerformance(filename, content, issues);
    checkAccessibility(filename, content, issues);
    checkBestPractices(filename, content, issues);
    checkSeo(filename, content, issues);
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<PerformanceIssue['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const scores = calculateScores(issues);
  const grade = computeGrade(scores.overall);
  const summary = buildSummary(scores, issues);

  return { scores, issues, grade, summary };
}

/* ─── AI Prompt Builder ─────────────────────────────────────────────────── */

export function buildPerformancePrompt(
  files: Record<string, { content: string }>,
): string {
  const report = profilePerformance(files);
  const fileList = Object.keys(files);
  const fileSummaries = fileList
    .map((f) => `  - ${f} (${(files[f].content.length / 1024).toFixed(1)}KB)`)
    .join('\n');

  const issueText = report.issues
    .map(
      (issue, idx) =>
        `${idx + 1}. [${issue.severity.toUpperCase()}] (${issue.category}) ${issue.message}\n` +
        `   Suggestion: ${issue.suggestion}` +
        (issue.lineRef ? ` (around line ${issue.lineRef})` : ''),
    )
    .join('\n');

  return [
    'You are an expert web performance auditor. Analyze the following files and provide detailed, actionable recommendations.',
    '',
    '## Files Analyzed',
    fileSummaries,
    '',
    '## Static Analysis Results',
    `Grade: ${report.grade} (${report.scores.overall}/100)`,
    `- Performance: ${report.scores.performance}/100`,
    `- Accessibility: ${report.scores.accessibility}/100`,
    `- Best Practices: ${report.scores.bestPractices}/100`,
    `- SEO: ${report.scores.seo}/100`,
    '',
    '## Issues Found',
    issueText || 'No issues detected by static analysis.',
    '',
    '## Your Task',
    'Based on the static analysis above and the source code provided, please:',
    '1. Confirm or refine each finding — are there false positives?',
    '2. Identify additional issues the static analyzer may have missed (e.g., render-blocking CSS, layout thrashing, memory leaks, ARIA misuse).',
    '3. Prioritize the top 5 changes that would have the biggest positive impact.',
    '4. For each recommendation, provide a specific code fix or refactoring suggestion.',
    '5. Estimate the performance improvement (e.g., "reduces LCP by ~200ms").',
    '',
    '## Source Code',
    ...fileList.map(
      (f) => `### ${f}\n\`\`\`\n${files[f].content.substring(0, 8000)}\n\`\`\`\n`,
    ),
  ].join('\n');
}
