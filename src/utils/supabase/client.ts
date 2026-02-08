import { createBrowserClient } from '@supabase/ssr';
import { validateClientEnv } from '../env';

/**
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트
 * Client Components에서 사용
 *
 * Next.js 15 + @supabase/ssr 표준
 */
export function createClient() {
  // 환경 변수 검증 (개발 환경에서는 경고만)
  validateClientEnv();

  // 환경 변수가 없으면 더미 값 사용 (개발 환경)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // 환경 변수가 없으면 경고
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase Client] ⚠️ 환경 변수가 설정되지 않았습니다. 더미 클라이언트를 사용합니다.');
    console.warn('[Supabase Client] .env.local 파일을 생성하고 Supabase 키를 설정해주세요.');
  }

  // 기본 설정 사용 - @supabase/ssr이 자동으로 쿠키 처리
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
