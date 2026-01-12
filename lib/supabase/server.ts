import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase Server Client
 * 
 * 비즈니스 목적:
 * - 서버 사이드에서 Supabase에 접근 (API Routes, Server Components)
 * - 서버 사이드 인증 상태 확인
 * - 보안이 중요한 데이터 조회
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 쿠키 설정 실패 시 무시
          }
        },
      },
    }
  );
}
