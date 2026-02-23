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

/**
 * 에러 메시지를 패턴 매칭으로 분류하여 심각도와 카테고리를 결정한다.
 *
 * `SEVERITY_RULES` 배열을 순회하며 첫 번째로 매칭되는 규칙을 적용한다.
 * 어떤 규칙에도 매칭되지 않으면 `severity: "info"`, `category: "client"`로 분류한다.
 *
 * `shouldAlert`는 `critical` 또는 `error` 심각도일 때 `true`로 설정되어
 * Slack 등 외부 알림 전송 여부를 제어한다.
 *
 * @param error - 분류할 {@link Error} 객체 또는 에러 메시지 문자열
 * @param context - (선택) 에러와 함께 기록할 추가 컨텍스트 (예: `{ userId, endpoint }`)
 * @returns 심각도, 카테고리, 알림 여부 등이 포함된 {@link ClassifiedError} 객체
 *
 * @example
 * ```ts
 * const classified = classifyError(new Error("payment failed"));
 * // { severity: "critical", category: "payment", shouldAlert: true, ... }
 *
 * const info = classifyError("user clicked button");
 * // { severity: "info", category: "client", shouldAlert: false, ... }
 * ```
 */
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

/**
 * 에러 심각도에 대응하는 이모지를 반환한다.
 *
 * Slack 알림이나 로그 메시지에서 심각도를 시각적으로 구분하기 위해 사용한다.
 *
 * - `critical` → 빨간 원
 * - `error` → 주황 원
 * - `warning` → 노란 원
 * - `info` → 파란 원
 *
 * @param severity - 이모지를 조회할 {@link ErrorSeverity} 값
 * @returns 해당 심각도에 대응하는 이모지 문자열
 *
 * @example
 * ```ts
 * severityEmoji("critical"); // "🔴"
 * severityEmoji("info");     // "🔵"
 * ```
 */
export function severityEmoji(severity: ErrorSeverity): string {
  const map: Record<ErrorSeverity, string> = {
    critical: "\uD83D\uDD34",
    error: "\uD83D\uDFE0",
    warning: "\uD83D\uDFE1",
    info: "\uD83D\uDD35",
  };
  return map[severity];
}
