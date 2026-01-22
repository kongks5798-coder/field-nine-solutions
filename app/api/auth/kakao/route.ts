/**
 * K-UNIVERSAL Kakao OAuth with PKCE
 * Production-Grade secure authentication
 *
 * Security Features:
 * - PKCE (Proof Key for Code Exchange) flow
 * - State parameter for CSRF protection
 * - Secure session handling
 *
 * @route GET /api/auth/kakao
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure random string
 */
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from verifier (S256 method)
 */
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const requestId = `kakao_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const cookieStore = await cookies();

    // Create Supabase client with PKCE flow
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
        auth: {
          flowType: 'pkce', // Use PKCE instead of implicit
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );

    // Generate PKCE code verifier and store in cookie
    const codeVerifier = generateCodeVerifier();

    // Store code verifier in secure cookie for callback
    cookieStore.set('pkce_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${origin}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: {
          // Supabase handles PKCE automatically when flowType is 'pkce'
        },
      },
    });

    if (error || !data.url) {
      logger.error('kakao_oauth_init_failed', {
        requestId,
        error: error?.message || 'No URL returned',
      });

      return NextResponse.redirect(
        new URL('/ko/auth/login?error=카카오 로그인 초기화 실패', origin)
      );
    }

    logger.info('kakao_oauth_redirect', {
      requestId,
      redirectUrl: data.url.split('?')[0], // Log URL without query params
    });

    return NextResponse.redirect(data.url);
  } catch (error) {
    logger.error('kakao_oauth_error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.redirect(
      new URL('/ko/auth/login?error=카카오 로그인 중 오류 발생', origin)
    );
  }
}
