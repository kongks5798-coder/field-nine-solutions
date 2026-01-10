"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

/**
 * NextAuth Session Provider
 * 
 * 클라이언트 컴포넌트에서 useSession() 사용을 위해 필요
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
