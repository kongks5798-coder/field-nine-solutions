/**
 * Next.js Middleware
 * 
 * Supabase 인증 기반 페이지 보호
 * 
 * 보호되는 경로:
 * - /dashboard/*
 * - /api/ai/* (일부)
 */

import { createClient } from '@/src/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 보호가 필요한 경로
  const protectedPaths = ['/dashboard', '/api/ai'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // 로그인 페이지는 로그인된 사용자를 대시보드로 리다이렉트
  if (pathname === '/login') {
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('[Middleware] 세션 확인 오류:', error);
    }
    
    return NextResponse.next();
  }

  // 보호된 경로 접근 시 로그인 체크
  if (isProtectedPath) {
    try {
      const supabase = await createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // 세션 유효성 확인 (만료된 토큰 체크)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        loginUrl.searchParams.set('error', 'session_expired');
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('[Middleware] 인증 확인 오류:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      loginUrl.searchParams.set('error', 'auth_error');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase Auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
