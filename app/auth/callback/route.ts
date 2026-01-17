/**
 * K-UNIVERSAL OAuth Callback Route
 * Supabase OAuth 콜백 처리 (카카오, 구글 등)
 *
 * Flow:
 * 1. User clicks "카카오 로그인"
 * 2. Redirected to Kakao → User authenticates
 * 3. Kakao redirects to this route with `code` parameter
 * 4. This route exchanges code for session
 * 5. Redirects to dashboard
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // OAuth code from provider (Kakao/Google)
  const code = searchParams.get('code');
  // Where to redirect after login (default: dashboard)
  const next = searchParams.get('next') ?? '/ko/dashboard';
  // Error from OAuth provider
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/ko/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // No code = invalid callback
  if (!code) {
    console.error('[OAuth Callback] No code provided');
    return NextResponse.redirect(
      `${origin}/ko/auth/login?error=${encodeURIComponent('인증 코드가 없습니다')}`
    );
  }

  try {
    // Create Supabase server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore errors in middleware
            }
          },
        },
      }
    );

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[OAuth Callback] Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${origin}/ko/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (data.session) {
      console.log('[OAuth Callback] Session created for:', data.session.user.email);

      // Create or update user profile in database
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.session.user.id,
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name ||
                       data.session.user.user_metadata?.name ||
                       data.session.user.email?.split('@')[0],
            avatar_url: data.session.user.user_metadata?.avatar_url ||
                        data.session.user.user_metadata?.picture,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (profileError) {
          console.warn('[OAuth Callback] Profile upsert warning:', profileError);
          // Don't fail login for profile errors
        }
      } catch (err) {
        console.warn('[OAuth Callback] Profile creation error:', err);
        // Continue with login even if profile creation fails
      }

      // Redirect to the requested page or dashboard
      const redirectUrl = next.startsWith('/') ? `${origin}${next}` : next;
      return NextResponse.redirect(redirectUrl);
    }

    // No session created
    console.error('[OAuth Callback] No session created');
    return NextResponse.redirect(
      `${origin}/ko/auth/login?error=${encodeURIComponent('세션을 생성할 수 없습니다')}`
    );

  } catch (err) {
    console.error('[OAuth Callback] Unexpected error:', err);
    return NextResponse.redirect(
      `${origin}/ko/auth/login?error=${encodeURIComponent('인증 처리 중 오류가 발생했습니다')}`
    );
  }
}
