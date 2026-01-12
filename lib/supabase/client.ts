import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client
 * 
 * 비즈니스 목적:
 * - 클라이언트 사이드에서 Supabase에 접근 (인증, 데이터 조회)
 * - 사용자 세션 관리로 인증 상태 추적
 * - 분석 결과 저장 및 조회
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
