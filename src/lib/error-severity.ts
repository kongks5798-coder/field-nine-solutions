/**
 * Dalkak — Error Severity Classification System
 *
 * 에러 메시지를 패턴 매칭으로 분류하여 심각도(critical/error/warning/info)와
 * 카테고리(payment/auth/api/db/infra/client)를 결정한다.
 * shouldAlert 플래그로 Slack 알림 여부를 제어한다.
 */

export type ErrorSeverity = "critical" | "error" | "warning" | "info";

export interface ClassifiedError {
  severity: ErrorSeverity;
  category: string; // 'payment', 'auth', 'api', 'db', 'infra', 'client'
  message: string;
  context?: Record<string, unknown>;
  shouldAlert: boolean;
}

const SEVERITY_RULES: Array<{
  pattern: RegExp;
  severity: ErrorSeverity;
  category: string;
}> = [
  // Critical: 결제, DB 연결, 인증 시스템 장애
  {
    pattern: /payment|billing|stripe|toss|checkout/i,
    severity: "critical",
    category: "payment",
  },
  {
    pattern: /database|supabase.*connection|pool.*exhaust/i,
    severity: "critical",
    category: "db",
  },
  {
    pattern: /auth.*fail|jwt.*expired|token.*invalid/i,
    severity: "error",
    category: "auth",
  },
  // Error: API 실패, 외부 서비스 장애
  {
    pattern: /api.*error|fetch.*fail|timeout/i,
    severity: "error",
    category: "api",
  },
  {
    pattern: /openai|anthropic|gemini|grok.*error/i,
    severity: "error",
    category: "api",
  },
  // Warning: 레이트 리미트, 유효성 검증
  {
    pattern: /rate.*limit|too.*many.*request/i,
    severity: "warning",
    category: "infra",
  },
  {
    pattern: /validation|invalid.*input|zod/i,
    severity: "warning",
    category: "client",
  },
  // Info: 일반 (catch-all)
  { pattern: /.*/, severity: "info", category: "client" },
];

export function classifyError(
  error: Error | string,
  context?: Record<string, unknown>,
): ClassifiedError {
  const message = typeof error === "string" ? error : error.message;

  for (const rule of SEVERITY_RULES) {
    if (rule.pattern.test(message)) {
      return {
        severity: rule.severity,
        category: rule.category,
        message,
        context,
        shouldAlert:
          rule.severity === "critical" || rule.severity === "error",
      };
    }
  }

  return {
    severity: "info",
    category: "client",
    message,
    context,
    shouldAlert: false,
  };
}

export function severityEmoji(severity: ErrorSeverity): string {
  const map: Record<ErrorSeverity, string> = {
    critical: "\uD83D\uDD34",
    error: "\uD83D\uDFE0",
    warning: "\uD83D\uDFE1",
    info: "\uD83D\uDD35",
  };
  return map[severity];
}
