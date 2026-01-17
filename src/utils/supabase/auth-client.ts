/**
 * OAuth 전용 Supabase 클라이언트
 * 기본 설정 사용 - Supabase가 자동으로 PKCE 처리
 */
import { createBrowserClient } from '@supabase/ssr';

export function getAuthClient() {
  if (typeof window === 'undefined') {
    throw new Error('Auth client can only be used in browser');
  }

  // 매번 새로운 클라이언트 생성 (SSR 표준 방식)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// localStorage 디버깅용
export function debugAuthStorage() {
  if (typeof window === 'undefined') return null;

  const keys = Object.keys(localStorage).filter(k =>
    k.includes('supabase') || k.includes('sb-') || k.includes('pkce') || k.includes('code')
  );

  const data: Record<string, string | null> = {};
  keys.forEach(k => {
    data[k] = localStorage.getItem(k);
  });

  console.log('[Auth Debug] Storage keys:', keys);
  return data;
}
