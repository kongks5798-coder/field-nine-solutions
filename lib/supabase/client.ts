/**
 * Supabase Browser Client
 * 클라이언트 사이드 인증 및 데이터 접근
 * @version 2.0.0 - Production Grade with PKCE Flow
 */

import { createBrowserClient } from '@supabase/ssr';
import { type Provider } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser용 Supabase 클라이언트 (Singleton)
 * - PKCE Flow 적용
 * - 자동 세션 갱신
 */
export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseInstance;
}

// Legacy export
export const supabase = createClient();

/**
 * Auth Helper Functions
 * 모든 인증 관련 기능 통합
 */
export const auth = {
  /**
   * 이메일/비밀번호 회원가입
   */
  signUp: async (
    email: string,
    password: string,
    metadata?: { name?: string; phone?: string }
  ) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signUp exception:', err);
      return { data: null, error: { message: '회원가입 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * 이메일/비밀번호 로그인
   */
  signIn: async (email: string, password: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signIn exception:', err);
      return { data: null, error: { message: '로그인 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * Magic Link (이메일 OTP) 로그인
   */
  signInWithOtp: async (email: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signInWithOtp exception:', err);
      return { data: null, error: { message: '이메일 전송 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * OAuth 로그인 (카카오, 구글 등)
   * PKCE Flow 자동 적용
   */
  signInWithOAuth: async (provider: 'kakao' | 'google') => {
    const supabase = createClient();

    try {
      // 현재 locale 감지
      const locale = window.location.pathname.split('/')[1] || 'ko';
      const redirectTo = `${window.location.origin}/auth/callback?next=/${locale}/dashboard`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] signInWithOAuth exception:', err);
      return {
        data: null,
        error: { message: `${provider} 로그인 중 오류가 발생했습니다.` }
      };
    }
  },

  /**
   * 로그아웃
   */
  signOut: async () => {
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] signOut exception:', err);
      return { error: { message: '로그아웃 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * 현재 사용자 가져오기
   */
  getUser: async () => {
    const supabase = createClient();

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null, error: formatAuthError(error) };
      }

      return { user, error: null };
    } catch (err) {
      console.error('[Auth] getUser exception:', err);
      return { user: null, error: { message: '사용자 정보를 가져올 수 없습니다.' } };
    }
  },

  /**
   * 현재 세션 가져오기
   */
  getSession: async () => {
    const supabase = createClient();

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return { session: null, error: formatAuthError(error) };
      }

      return { session, error: null };
    } catch (err) {
      console.error('[Auth] getSession exception:', err);
      return { session: null, error: { message: '세션을 가져올 수 없습니다.' } };
    }
  },

  /**
   * 비밀번호 재설정 이메일
   */
  resetPassword: async (email: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] resetPassword exception:', err);
      return { data: null, error: { message: '비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * 비밀번호 업데이트
   */
  updatePassword: async (newPassword: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { data: null, error: formatAuthError(error) };
      }

      return { data, error: null };
    } catch (err) {
      console.error('[Auth] updatePassword exception:', err);
      return { data: null, error: { message: '비밀번호 변경 중 오류가 발생했습니다.' } };
    }
  },

  /**
   * 인증 상태 변경 리스너
   */
  onAuthStateChange: (
    callback: (event: string, session: unknown) => void
  ) => {
    const supabase = createClient();
    return supabase.auth.onAuthStateChange(callback);
  },
};

/**
 * 에러 메시지 한글화 및 포맷팅
 */
function formatAuthError(error: { message: string; status?: number }): { message: string } {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
    'Unable to validate email address: invalid format': '올바른 이메일 형식이 아닙니다.',
    'Email rate limit exceeded': '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    'Signups not allowed for this instance': '현재 회원가입이 비활성화되어 있습니다.',
    'User not found': '존재하지 않는 사용자입니다.',
    'Invalid Refresh Token': '세션이 만료되었습니다. 다시 로그인해주세요.',
    'New password should be different from the old password': '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
    'Auth session missing': '로그인이 필요합니다.',
    'provider is not enabled': '해당 로그인 방식이 활성화되어 있지 않습니다.',
    'Unsupported provider': '지원하지 않는 로그인 방식입니다.',
  };

  // Check for matching error message
  for (const [key, value] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return { message: value };
    }
  }

  // Default error message
  return { message: error.message || '알 수 없는 오류가 발생했습니다.' };
}
