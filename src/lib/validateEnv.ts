/**
 * validateEnv.ts
 * 런타임 환경변수 검증 유틸.
 * 빌드 단계에서는 skip, 런타임에만 경고/에러 출력.
 */

const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
] as const;

const OPTIONAL_VARS = [
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "TOSSPAYMENTS_SECRET_KEY",
  "SENTRY_DSN",
] as const;

export function validateEnv() {
  // 빌드 단계에서는 skip (환경변수 없어도 빌드는 통과)
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[Dalkak] ❌ Missing required env vars: ${missing.join(", ")}`
    );
    // 런타임 경고만 출력, throw하지 않음 (기능별로 개별 핸들링)
  }

  const missingOptional = OPTIONAL_VARS.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `[Dalkak] ⚠ Missing optional env vars: ${missingOptional.join(", ")}`
    );
  }
}

/** 개별 변수 존재 여부 확인 (boolean 반환) */
export function hasEnv(key: string): boolean {
  return !!process.env[key];
}

/** 서비스별 설정 여부 요약 */
export function getEnvStatus() {
  return {
    supabase:
      hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
    anthropic: hasEnv("ANTHROPIC_API_KEY"),
    openai: hasEnv("OPENAI_API_KEY"),
    resend: hasEnv("RESEND_API_KEY"),
    cronSecret: hasEnv("CRON_SECRET"),
    tossPayments: hasEnv("TOSSPAYMENTS_SECRET_KEY"),
    sentry: hasEnv("SENTRY_DSN"),
  };
}
