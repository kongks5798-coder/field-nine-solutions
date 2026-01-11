/**
 * Field Nine Authentication System
 * 
 * Supabase Auth 기반 인증 시스템
 * NextAuth.js는 제거되고 Supabase로 통일됨
 * 
 * 사용법:
 * - 클라이언트: useSession() 훅 사용
 * - 서버: createClient() from '@/src/utils/supabase/server' 사용
 */

import { createClient } from '@/src/utils/supabase/server';

/**
 * 인증 상태 확인 헬퍼 (서버 사이드)
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[getCurrentUser] 오류:', error);
    return null;
  }
}

/**
 * 인증 필요 체크 (서버 사이드)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('인증이 필요합니다.');
  }
  return user;
}

/**
 * 세션 확인 (서버 사이드)
 */
export async function getSession() {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[getSession] 오류:', error);
    return null;
  }
}
