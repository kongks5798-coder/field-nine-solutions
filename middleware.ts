/**
 * Next.js Middleware
 * 
 * 인증이 필요한 페이지 보호
 * 
 * 보호되는 경로:
 * - /dashboard/*
 * - /api/ai/*
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // 보호가 필요한 경로
  const protectedPaths = ["/dashboard", "/api/ai"]
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 로그인 페이지는 로그인된 사용자를 대시보드로 리다이렉트
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // 보호된 경로 접근 시 로그인 체크
  if (isProtectedPath && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
