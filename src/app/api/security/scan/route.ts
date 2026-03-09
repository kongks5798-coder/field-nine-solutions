import { NextRequest, NextResponse } from "next/server";
import { checkLimit, ipFromHeaders, headersFor } from "@/core/rateLimit";

export const runtime = "edge";

// ── Types ────────────────────────────────────────────────────────────────────

type Severity = "high" | "medium" | "low";

interface ScanIssue {
  type: string;
  message: string;
  severity: Severity;
}

interface ScanResult {
  safe: boolean;
  score: number;
  issues: ScanIssue[];
}

// ── Detectors ────────────────────────────────────────────────────────────────

function detectEval(html: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  // Match eval(...) or new Function(...) — avoid false-positives from comments
  const evalPattern = /\beval\s*\(|new\s+Function\s*\(/g;
  if (evalPattern.test(html)) {
    issues.push({
      type: "eval",
      message: "동적 코드 실행 감지: eval() 또는 new Function() 사용",
      severity: "high",
    });
  }
  return issues;
}

function detectCryptoMining(html: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const miningPatterns = [
    /CoinHive/i,
    /Coinhive/i,
    /coinhive\.min\.js/i,
    /monero/i,
    /cryptonight/i,
    /minero\.cc/i,
    /authedmine/i,
    /crypto-loot/i,
  ];
  const matched = miningPatterns.some(p => p.test(html));
  if (matched) {
    issues.push({
      type: "cryptomining",
      message: "크립토 마이닝 감지: 브라우저 기반 채굴 라이브러리 참조",
      severity: "high",
    });
  }
  return issues;
}

function detectSuspiciousRedirects(html: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  // Look for window.location = "http..." or document.location = "http..." pointing externally
  const redirectPattern =
    /(?:window|document)\.location\s*=\s*['"`](https?:\/\/(?!localhost)[^'"`]+)['"`]/gi;
  const matches = html.match(redirectPattern);
  if (matches && matches.length > 0) {
    issues.push({
      type: "redirect",
      message: `외부 리디렉션 감지: ${matches.length}개의 외부 리디렉션 패턴 발견`,
      severity: "medium",
    });
  }
  return issues;
}

function detectDataExfiltration(html: string): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // Detect fetch() or XMLHttpRequest to external URLs combined with sensitive keywords
  const externalFetchPattern =
    /(?:fetch|axios\.(?:post|put|patch))\s*\(\s*['"`](https?:\/\/(?!localhost)[^'"`]+)['"`]/gi;
  const xhrPattern =
    /XMLHttpRequest[\s\S]{0,200}(?:open\s*\(\s*['"`](?:POST|PUT|PATCH)['"`][\s\S]{0,100}https?:\/\/(?!localhost))/gi;

  const sensitiveKeywords = /(?:password|token|apikey|api_key|secret|credential|auth)/i;

  const fetchMatches = [...html.matchAll(externalFetchPattern)].map(m => m[0]);
  const xhrMatches = [...html.matchAll(xhrPattern)].map(m => m[0]);
  const allMatches = [...fetchMatches, ...xhrMatches];

  const suspiciousMatches = allMatches.filter(m => sensitiveKeywords.test(m));
  if (suspiciousMatches.length > 0) {
    issues.push({
      type: "exfiltration",
      message: `외부 데이터 전송 감지: 민감 데이터를 외부 URL로 전송하는 패턴 ${suspiciousMatches.length}개 발견`,
      severity: "high",
    });
  } else if (allMatches.length > 3) {
    // Many external fetch calls — lower severity warning
    issues.push({
      type: "exfiltration",
      message: `외부 요청 다수 감지: ${allMatches.length}개의 외부 네트워크 요청 패턴`,
      severity: "low",
    });
  }
  return issues;
}

function detectMaliciousIframe(html: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  // Detect dynamic iframe creation with external src
  const iframePattern =
    /(?:createElement\s*\(\s*['"`]iframe['"`]\)|\.src\s*=\s*['"`]https?:\/\/(?!localhost))/gi;
  const matches = html.match(iframePattern);
  if (matches && matches.length > 0) {
    issues.push({
      type: "iframe",
      message: `악성 iframe 감지: 외부 src를 가진 동적 iframe 생성 패턴 ${matches.length}개`,
      severity: "medium",
    });
  }
  return issues;
}

// ── Score Calculator ─────────────────────────────────────────────────────────

function calcScore(issues: ScanIssue[]): number {
  const penaltyMap: Record<Severity, number> = { high: 40, medium: 15, low: 5 };
  const totalPenalty = issues.reduce((sum, issue) => sum + penaltyMap[issue.severity], 0);
  return Math.max(0, 100 - totalPenalty);
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limiting: 20/min per IP
  const ip = ipFromHeaders(req.headers);
  const rl = checkLimit(`security:scan:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before scanning again." },
      { status: 429, headers: headersFor(rl) }
    );
  }

  let body: { html?: unknown; slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const html = typeof body.html === "string" ? body.html : "";
  if (!html) {
    return NextResponse.json({ error: "html field is required" }, { status: 400 });
  }

  // Cap at 2MB to avoid abuse
  if (html.length > 2_000_000) {
    return NextResponse.json({ error: "html too large (max 2MB)" }, { status: 413 });
  }

  // Run all detectors
  const issues: ScanIssue[] = [
    ...detectEval(html),
    ...detectCryptoMining(html),
    ...detectSuspiciousRedirects(html),
    ...detectDataExfiltration(html),
    ...detectMaliciousIframe(html),
  ];

  const score = calcScore(issues);
  const hasHighSeverity = issues.some(i => i.severity === "high");
  const safe = score >= 70 && !hasHighSeverity;

  const result: ScanResult = { safe, score, issues };

  return NextResponse.json(result, {
    status: 200,
    headers: headersFor(rl),
  });
}
