import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { validateServerEnv } from '../env';

/**
 * 서버 사이드에서 사용하는 Supabase 클라이언트
 * Route Handlers, Server Components에서 사용
 * 
 * Next.js 15 호환: cookies()가 Promise일 수 있으므로 await 처리
 */
export async function createClient() {
  // 환경 변수 검증 (개발 환경에서는 경고만)
  validateServerEnv();

  // 환경 변수가 없으면 더미 값 사용 (개발 환경)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // 환경 변수가 없으면 경고
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase Server] ⚠️ 환경 변수가 설정되지 않았습니다. 더미 클라이언트를 사용합니다.');
    console.warn('[Supabase Server] .env.local 파일을 생성하고 Supabase 키를 설정해주세요.');
  }

  // Next.js 15: cookies()가 Promise일 수 있으므로 await 처리
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch (error) {
          console.error(`[Supabase Server] 쿠키 읽기 오류 (${name}):`, error);
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // CSRF 보호: SameSite 설정 강화
          const secureOptions: CookieOptions = {
            ...options,
            sameSite: 'lax', // OAuth 리다이렉트를 위해 'lax' 사용
            httpOnly: name.includes('auth-token') || name.includes('sb-'),
            secure: process.env.NODE_ENV === 'production',
          };
          cookieStore.set(name, value, secureOptions);
        } catch (error) {
          // 서버 컴포넌트에서 쿠키를 직접 설정할 수 없는 경우 (읽기 전용)
          // Route Handler에서는 정상 작동
          console.error(`[Supabase Server] 쿠키 설정 오류 (${name}):`, error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // CSRF 보호: SameSite 설정 강화
          const secureOptions: CookieOptions = {
            ...options,
            sameSite: 'lax',
            httpOnly: name.includes('auth-token') || name.includes('sb-'),
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
          };
          cookieStore.set(name, '', secureOptions);
        } catch (error) {
          console.error(`[Supabase Server] 쿠키 삭제 오류 (${name}):`, error);
        }
      },
    },
  });
}
