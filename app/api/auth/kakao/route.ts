import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * 카카오 로그인 - Implicit Flow (PKCE 비활성화)
 */
export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Implicit flow용 클라이언트 (PKCE 사용 안 함)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      }
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error('[Kakao] OAuth error:', error);
    return NextResponse.redirect(
      new URL('/ko/auth/login?error=카카오 로그인 실패', origin)
    );
  }

  console.log('[Kakao] Redirecting to:', data.url);

  return NextResponse.redirect(data.url);
}
