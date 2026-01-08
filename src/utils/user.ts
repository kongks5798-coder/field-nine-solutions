/**
 * Users 테이블 관련 유틸리티 함수
 * public.users 테이블 자동 생성 로직
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface EnsureUserParams {
  userId: string;
  email: string | undefined;
  avatarUrl?: string;
  fullName?: string;
}

/**
 * public.users 테이블에 유저가 없으면 자동 생성
 * Trigger가 있지만, 확실하게 하기 위해 명시적으로 호출
 * @param supabase Supabase 클라이언트
 * @param params 유저 생성 파라미터
 * @returns 성공 여부
 */
export async function ensureUser(
  supabase: SupabaseClient,
  params: EnsureUserParams
): Promise<boolean> {
  try {
    // 기존 유저 확인
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', params.userId)
      .single();

    // 유저가 이미 있으면 last_login_at만 업데이트
    if (existingUser && !selectError) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.userId);

      if (updateError) {
        console.error('[ensureUser] 로그인 시간 업데이트 오류:', updateError);
        // 실패해도 계속 진행
      }
      return true;
    }

    // 유저가 없으면 생성
    const { error: insertError } = await supabase.from('users').insert({
      id: params.userId,
      email: params.email,
      avatar_url: params.avatarUrl,
      full_name: params.fullName || params.email?.split('@')[0] || 'New User',
      plan_type: 'free', // 기본값: 무료 플랜
      subscription_status: 'trial', // 기본값: 트라이얼
      last_login_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('[ensureUser] 유저 생성 오류:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ensureUser] 예상치 못한 오류:', error);
    return false;
  }
}
