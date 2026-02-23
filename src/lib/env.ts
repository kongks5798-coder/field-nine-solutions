/**
 * 필수 환경변수 검증 — 서버 시작 시 누락된 변수를 조기에 감지
 * 빌드 시에는 실행되지 않고, API route에서 최초 import 시 1회 실행
 */
import { log } from '@/lib/logger';

const REQUIRED_SERVER = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const OPTIONAL_SERVER = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'TOSSPAYMENTS_SECRET_KEY',          // TossPayments 시크릿 키
  'RESEND_API_KEY',
  'ADMIN_SECRET',
  'CRON_SECRET',                       // Vercel Cron 보안 시크릿
  'NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY', // TossPayments 클라이언트 키
  'UPSTASH_REDIS_REST_URL',            // Upstash Redis URL
  'UPSTASH_REDIS_REST_TOKEN',          // Upstash Redis Token
  'SENTRY_DSN',                        // Sentry 에러 모니터링
  'NEXT_PUBLIC_POSTHOG_KEY',           // PostHog 제품 분석
  'NEXT_PUBLIC_POSTHOG_HOST',          // PostHog 호스트 (기본: app.posthog.com)
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;
  // next build (phase-production-build) 단계에서는 검증 건너뜀
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  validated = true;

  const missing: string[] = [];
  for (const key of REQUIRED_SERVER) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `[Dalkak] 필수 환경변수 누락: ${missing.join(', ')}`;
    log.error('env.required_vars_missing', { missing });
    // 프로덕션에서는 에러로 처리
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
  }

  const missingOptional = OPTIONAL_SERVER.filter(k => !process.env[k]);
  if (missingOptional.length > 0) {
    log.warn('env.optional_vars_missing', { missing: missingOptional });
  }
}
