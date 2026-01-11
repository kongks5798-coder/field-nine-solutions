import { createClient } from '@/src/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * OAuth 콜백 처리
 * GET /auth/callback
 * 
 * Supabase OAuth 인증 후 리다이렉트 처리
 */

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // 에러 처리
  if (error) {
    console.error('[Auth Callback] OAuth 오류:', error, errorDescription);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error);
    if (errorDescription) {
      loginUrl.searchParams.set('message', errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 인증 코드 확인
  if (!code) {
    console.error('[Auth Callback] 인증 코드가 없습니다.');
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'no_code');
    loginUrl.searchParams.set('message', '인증 코드를 받지 못했습니다.');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();

    // 인증 코드를 세션으로 교환
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session) {
      console.error('[Auth Callback] 세션 교환 오류:', sessionError);
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'session_exchange_failed');
      loginUrl.searchParams.set('message', sessionError?.message || '세션 생성에 실패했습니다.');
      return NextResponse.redirect(loginUrl);
    }

    // 사용자 정보 확인 및 users 테이블에 자동 생성 (트리거가 있다면)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // users 테이블에 사용자 정보가 없으면 생성
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (userError) {
        console.error('[Auth Callback] 사용자 정보 저장 오류:', userError);
        // 사용자 정보 저장 실패는 치명적이지 않으므로 계속 진행
      }
    }

    // 성공 시 원래 요청한 페이지로 리다이렉트
    const redirectUrl = new URL(next, requestUrl.origin);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Auth Callback] 예상치 못한 오류:', error);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'oauth_error');
    loginUrl.searchParams.set('message', error.message || 'OAuth 인증 중 오류가 발생했습니다.');
    return NextResponse.redirect(loginUrl);
  }
}
