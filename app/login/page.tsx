"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { Loader2 } from "lucide-react"

/**
 * 로그인 페이지
 * 
 * 카카오톡/구글 로그인 지원
 * NextAuth.js 사용
 */

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: "kakao" | "google") => {
    setLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error("로그인 오류:", error)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0F0F0F] px-4">
      <Card className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-[#E5E5E0] dark:border-[#2A2A2A]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-[#171717] dark:text-[#F5F5F5]">
            Field Nine
          </CardTitle>
          <CardDescription className="text-[#6B6B6B] dark:text-[#A3A3A3]">
            AI 기반 ERP 시스템에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 카카오톡 로그인 */}
          <Button
            onClick={() => handleSignIn("kakao")}
            disabled={loading !== null}
            className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] font-medium h-12"
          >
            {loading === "kakao" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                카카오톡으로 로그인
              </>
            )}
          </Button>

          {/* 구글 로그인 */}
          <Button
            onClick={() => handleSignIn("google")}
            disabled={loading !== null}
            variant="outline"
            className="w-full h-12 border-[#E5E5E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#171717] dark:text-[#F5F5F5] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
          >
            {loading === "google" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                구글로 로그인
              </>
            )}
          </Button>

          <div className="text-center text-sm text-[#6B6B6B] dark:text-[#A3A3A3] pt-4">
            <p>로그인 시 Field Nine의</p>
            <p>
              <a href="/terms" className="underline hover:text-[#1A5D3F] dark:hover:text-[#2DD4BF]">
                이용약관
              </a>
              {" 및 "}
              <a href="/privacy" className="underline hover:text-[#1A5D3F] dark:hover:text-[#2DD4BF]">
                개인정보처리방침
              </a>
              에 동의하게 됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] dark:bg-[#0F0F0F]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
