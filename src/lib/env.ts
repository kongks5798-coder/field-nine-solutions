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
  'TOSSPAYMENTS_SECRET_KEY',
  'RESEND_API_KEY',
  'ADMIN_SECRET',
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  const missing: string[] = [];
  for (const key of REQUIRED_SERVER) {
    if (!process.env[key] || process.env[key] === 'https://placeholder.supabase.co') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `[FieldNine] 필수 환경변수 누락: ${missing.join(', ')}`;
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
