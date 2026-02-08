/**
 * 프로필 관련 유틸리티 함수
 * 프로필 자동 생성 로직을 공통화
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface CreateProfileParams {
  userId: string;
  email: string | undefined;
  role?: string;
}

/**
 * 프로필이 없으면 자동 생성
 * @param supabase Supabase 클라이언트
 * @param params 프로필 생성 파라미터
 * @returns 성공 여부
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  params: CreateProfileParams
): Promise<boolean> {
  try {
    // 기존 프로필 확인
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.userId)
      .single();

    // 프로필이 이미 있으면 성공
    if (existingProfile && !selectError) {
      return true;
    }

    // 프로필이 없으면 생성
    const { error: insertError } = await supabase.from('profiles').insert({
      id: params.userId,
      email: params.email,
      role: params.role || 'employee',
    });

    if (insertError) {
      console.error('[ensureProfile] 프로필 생성 오류:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ensureProfile] 예상치 못한 오류:', error);
    return false;
  }
}
