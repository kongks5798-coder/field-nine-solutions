import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';

/**
 * 메인 루트 페이지
 * 세션 확인 후 적절한 페이지로 리다이렉트
 * 
 * - 로그인된 사용자: /dashboard
 * - 로그인되지 않은 사용자: /login
 */
export default async function HomePage() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 세션이 있으면 대시보드로, 없으면 로그인 페이지로
    if (session && !sessionError) {
      redirect('/dashboard');
    } else {
      redirect('/login');
    }
  } catch (error) {
    // 에러 발생 시 로그인 페이지로 리다이렉트
    console.error('[HomePage] 세션 확인 오류:', error);
    redirect('/login');
  }
}
