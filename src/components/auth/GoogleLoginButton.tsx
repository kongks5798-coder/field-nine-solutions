"use client";

import { createClient } from "@/src/utils/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Toast from "@/app/components/Toast";

/**
 * 구글 로그인 버튼 컴포넌트
 *
 * Next.js 15 + @supabase/ssr 표준
 * - Hydration Mismatch 방지 (초기 로딩 상태)
 */
export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const supabase = createClient();

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // 세션 확인 및 감시
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[GoogleLoginButton] 세션 확인 오류:", error);
          setSession(null);
        } else {
          setSession(currentSession);
        }
      } catch (err) {
        console.error("[GoogleLoginButton] 세션 확인 중 예상치 못한 오류:", err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: Session | null) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // 구글 로그인 핸들러
  const handleLogin = useCallback(async () => {
    try {
      setIsLoggingIn(true);

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/auth/callback?next=/dashboard`;

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        console.error("[GoogleLoginButton] 로그인 오류:", authError);
        let errorMessage = "Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.";

        if (authError.message.includes("unsupported_provider") || authError.message.includes("provider is not enabled")) {
          errorMessage = "Google 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Google 프로바이더를 활성화해주세요.";
        } else if (authError.message.includes("configuration")) {
          errorMessage = "Google OAuth 설정이 완료되지 않았습니다. Supabase 대시보드에서 Client ID와 Secret을 설정해주세요.";
        } else if (authError.message.includes("redirect_uri_mismatch")) {
          errorMessage = "리다이렉트 URL이 일치하지 않습니다. Google Cloud Console과 Supabase 설정을 확인해주세요.";
        }

        showToast(errorMessage, "error");
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error("[GoogleLoginButton] 예상치 못한 오류:", err);
      showToast("로그인 중 오류가 발생했습니다.", "error");
      setIsLoggingIn(false);
    }
  }, [supabase, showToast]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 px-6 py-3.5 min-h-[48px] bg-white border border-[#E5E5E0] rounded-lg opacity-50">
          <Loader2 className="w-5 h-5 animate-spin text-[#4285F4]" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // 이미 로그인된 상태면 버튼 숨김
  if (session) {
    return null;
  }

  // 비로그인 상태: 구글 로그인 버튼
  return (
    <>
      <button
        onClick={handleLogin}
        disabled={isLoggingIn}
        aria-label={isLoggingIn ? "Google 로그인 진행 중" : "Google 계정으로 로그인"}
        {...(isLoggingIn && { 'aria-busy': true })}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-white border border-[#E5E5E0] px-6 py-3.5 min-h-[48px] text-base font-semibold text-[#3c4043] shadow-sm transition-all duration-300 hover:bg-[#F8F9FA] hover:shadow-md active:bg-[#E8EAED] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogin();
          }
        }}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 text-[#4285F4]" aria-hidden="true" />
            <span>잠시만 기다려주세요...</span>
          </>
        ) : (
          <>
            {/* Google 아이콘 */}
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google로 계속하기</span>
          </>
        )}
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
