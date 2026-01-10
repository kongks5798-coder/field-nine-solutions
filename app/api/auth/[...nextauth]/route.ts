/**
 * NextAuth.js API Route
 * 
 * 인증 엔드포인트: /api/auth/[...nextauth]
 * 
 * 지원 기능:
 * - 카카오톡 로그인
 * - 구글 로그인
 * - 세션 관리
 * - 로그아웃
 */

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
