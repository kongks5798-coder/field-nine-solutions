import { createClient } from '@/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureProfile } from '@/src/utils/profile';
import { ensureUser } from '@/src/utils/user';
import { checkRateLimit } from '@/src/utils/rateLimit';

/**
 * OAuth 콜백 핸들러
 * Supabase OAuth 인증 후 코드를 세션으로 교환
 * 
 * Next.js 15 + @supabase/ssr 표준
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Rate Limiting: IP 기반 (프로덕션에서는 더 정교한 방법 사용 권장)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  if (!checkRateLimit(`auth-callback:${clientIp}`, 10, 60000)) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'rate_limit_exceeded');
    return NextResponse.redirect(loginUrl);
  }
  
  // 'next' 파라미터를 우선 확인, 없으면 'redirect' 파라미터 사용, 둘 다 없으면 기본값 '/dashboard'
  const redirectTo = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/dashboard';

  // Open Redirect 방지: redirectTo가 같은 origin인지 확인
  const isValidRedirect = (url: string): boolean => {
    try {
      // 상대 경로는 항상 유효
      if (url.startsWith('/')) {
        return true;
      }
      // 절대 경로는 같은 origin인지 확인
      const redirectUrl = new URL(url, requestUrl.origin);
      return redirectUrl.origin === requestUrl.origin;
    } catch {
      return false;
    }
  };

  const safeRedirectTo = isValidRedirect(redirectTo) ? redirectTo : '/dashboard';

  if (!code) {
    // 코드가 없으면 로그인 페이지로 리다이렉트 (에러 포함)
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'no_code');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();

    // 코드를 세션으로 교환
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] 세션 교환 오류:', exchangeError);
      const loginUrl = new URL('/login', requestUrl.origin);
      
      // 에러 타입에 따라 다른 메시지 전달
      if (exchangeError.message.includes('unsupported_provider') || exchangeError.message.includes('provider is not enabled')) {
        loginUrl.searchParams.set('error', 'provider_not_enabled');
        loginUrl.searchParams.set('message', 'OAuth 프로바이더가 활성화되지 않았습니다. Supabase 대시보드에서 설정해주세요.');
      } else if (exchangeError.message.includes('missing_auth_secret') || exchangeError.message.includes('configuration')) {
        loginUrl.searchParams.set('error', 'oauth_config_error');
        loginUrl.searchParams.set('message', 'OAuth 설정이 완료되지 않았습니다. Client ID와 Secret을 확인해주세요.');
      } else if (exchangeError.message.includes('session')) {
        loginUrl.searchParams.set('error', 'session_exchange_failed');
      } else {
        loginUrl.searchParams.set('error', 'oauth_error');
        loginUrl.searchParams.set('message', exchangeError.message);
      }
      
      return NextResponse.redirect(loginUrl);
    }

    // 세션 교환 성공 시 프로필 및 유저 자동 생성 (공통 함수 사용)
    if (session?.user) {
      // 1. public.users 테이블에 유저 생성 (상용 SaaS용)
      await ensureUser(supabase, {
        userId: session.user.id,
        email: session.user.email,
        avatarUrl: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      });

      // 2. profiles 테이블에도 프로필 생성 (기존 호환성 유지)
      await ensureProfile(supabase, {
        userId: session.user.id,
        email: session.user.email,
        role: 'employee',
      });

      // 블록체인에 인증 기록 저장 (비동기, 실패해도 로그인은 계속 진행)
      try {
        const provider = requestUrl.searchParams.get('provider') || 'unknown';
        await fetch(`${requestUrl.origin}/api/blockchain/store-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            action: 'login',
            metadata: { provider, method: 'oauth' },
          }),
        }).catch(err => console.warn('[Auth Callback] 블록체인 저장 실패 (무시됨):', err));
      } catch (error) {
        // 블록체인 저장 실패는 로그인을 막지 않음
        console.warn('[Auth Callback] 블록체인 저장 오류 (무시됨):', error);
      }
    }

    // 성공 시 안전한 경로로 리다이렉트
    // 상대 경로인 경우 그대로 사용, 절대 경로인 경우 origin과 결합
    const finalRedirectUrl = safeRedirectTo.startsWith('/')
      ? new URL(safeRedirectTo, requestUrl.origin)
      : new URL(safeRedirectTo);
    
    return NextResponse.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('[Auth Callback] 예상치 못한 오류:', error);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'unexpected_error');
    return NextResponse.redirect(loginUrl);
  }
}
