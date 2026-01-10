/**
 * Field Nine Authentication System
 * 
 * NextAuth.js v5 (Auth.js) 기반 인증 시스템
 * 카카오톡/구글 로그인 지원
 * KISS 원칙: 단순하고 직관적
 */

import NextAuth from "next-auth"
import Kakao from "next-auth/providers/kakao"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

/**
 * NextAuth 설정
 * 
 * 사용법:
 * - 카카오톡 로그인: /api/auth/signin?provider=kakao
 * - 구글 로그인: /api/auth/signin?provider=google
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // 세션에 사용자 ID 추가
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      // JWT에 사용자 ID 추가
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  session: {
    strategy: "database", // Prisma 세션 저장
  },
  secret: process.env.NEXTAUTH_SECRET,
})

/**
 * 인증 상태 확인 헬퍼
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

/**
 * 인증 필요 체크
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("인증이 필요합니다.")
  }
  return user
}
