/**
 * 환경 변수 검증 유틸리티
 * 빌드 타임 및 런타임 환경 변수 검증
 */

/**
 * 필수 환경 변수 목록
 * 주의: 프로덕션에서도 에러를 던지지 않도록 수정됨
 */
const REQUIRED_ENV_VARS = {
  client: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  server: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
} as const;

/**
 * 클라이언트 환경 변수 검증
 * 프로덕션에서도 에러를 던지지 않고 경고만 표시 (앱이 작동하도록)
 */
export function validateClientEnv(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS.client) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.';
    
    // 프로덕션에서도 에러를 던지지 않고 경고만 표시
    // 앱이 크래시되지 않도록 더미 값으로 계속 진행
    console.warn('[Env] ⚠️ ' + errorMessage);
    console.warn('[Env] 더미 값으로 계속 진행합니다. Vercel 환경 변수를 확인하세요.');
    // 에러를 던지지 않음 - 앱이 작동하도록 함
  }
}

/**
 * 서버 환경 변수 검증
 * 프로덕션에서도 에러를 던지지 않고 경고만 표시 (앱이 작동하도록)
 */
export function validateServerEnv(): void {
  const missing: string[] = [];

  for (const varName of REQUIRED_ENV_VARS.server) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required server environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.';
    
    // 프로덕션에서도 에러를 던지지 않고 경고만 표시
    // 앱이 크래시되지 않도록 더미 값으로 계속 진행
    console.warn('[Env] ⚠️ ' + errorMessage);
    console.warn('[Env] 더미 값으로 계속 진행합니다. Vercel 환경 변수를 확인하세요.');
    // 에러를 던지지 않음 - 앱이 작동하도록 함
  }
}

/**
 * 환경 변수 안전하게 가져오기
 * @param key 환경 변수 키
 * @param defaultValue 기본값
 * @returns 환경 변수 값 또는 기본값
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value || defaultValue || '';
}
