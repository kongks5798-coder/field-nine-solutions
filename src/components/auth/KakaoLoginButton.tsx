"use client";

import { createBrowserClient } from '@supabase/ssr';
import { useState, useEffect, useCallback } from "react";
import { Loader2, LogOut, User } from "lucide-react";
import type { Session, User as SupabaseUser, SupabaseClient } from "@supabase/supabase-js";
import Toast from "@/app/components/Toast";

/**
 * 카카오 로그인 버튼 컴포넌트
 *
 * 클라이언트 측 OAuth 처리 (PKCE 지원)
 */
export default function KakaoLoginButton() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // 클라이언트에서만 Supabase 초기화
  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'implicit', // PKCE 대신 implicit flow 사용
          detectSessionInUrl: true,
          persistSession: true,
        }
      }
    );
    setSupabase(client);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // 세션 확인 및 감시
  useEffect(() => {
    if (!supabase) return;

    // 초기 세션 확인
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[KakaoLoginButton] 세션 확인 오류:", error);
          setSession(null);
          setUser(null);
        } else {
          setSession(currentSession);
          if (currentSession?.user) {
            setUser(currentSession.user);
          }
        }
      } catch (err) {
        console.error("[KakaoLoginButton] 세션 확인 중 예상치 못한 오류:", err);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Auth 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, newSession: Session | null) => {
      console.log("[KakaoLoginButton] Auth state changed:", event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      setIsLoggingIn(false);

      if (event === "SIGNED_IN" && newSession) {
        showToast("로그인 성공!", "success");
        // 대시보드로 이동
        setTimeout(() => {
          window.location.href = '/ko/dashboard';
        }, 500);
      } else if (event === "SIGNED_OUT") {
        window.location.reload();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, showToast]);

  // 카카오 로그인 핸들러 - 서버 API 사용
  const handleLogin = useCallback(() => {
    setIsLoggingIn(true);
    // 서버 API로 이동 (카카오 OAuth 직접 처리)
    window.location.href = '/api/auth/kakao';
  }, []);

  // 로그아웃 핸들러
  const handleLogout = useCallback(async () => {
    if (!supabase) return;

    try {
      setIsLoggingIn(true);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("[KakaoLoginButton] 로그아웃 오류:", signOutError);
        showToast("로그아웃 중 오류가 발생했습니다.", "error");
        setIsLoggingIn(false);
      } else {
        showToast("로그아웃되었습니다.", "success");
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (err) {
      console.error("[KakaoLoginButton] 로그아웃 중 예상치 못한 오류:", err);
      showToast("로그아웃 중 오류가 발생했습니다.", "error");
      setIsLoggingIn(false);
    }
  }, [supabase, showToast]);

  // 초기 로딩 상태
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 px-6 py-3.5 min-h-[48px] bg-[#FEE500] rounded-lg opacity-50">
          <Loader2 className="w-5 h-5 animate-spin text-[#000000]" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // 로그인된 상태: 유저 프로필 카드
  if (session && user) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 px-6 py-3.5 min-h-[48px] bg-white border border-[#E5E5E0] rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1A5D3F]/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#1A5D3F]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#171717] truncate">
                반갑습니다, <span className="text-[#1A5D3F]">{user.email?.split('@')[0] || '사용자'}</span>님!
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingIn}
            aria-label={isLoggingIn ? "로그아웃 중" : "로그아웃"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6B6B6B] bg-[#F5F5F5] hover:bg-[#E5E5E5] rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] focus:ring-offset-2"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 비로그인 상태: 카카오 로그인 버튼
  return (
    <>
      <button
        onClick={handleLogin}
        disabled={isLoggingIn}
        aria-label={isLoggingIn ? "카카오 로그인 진행 중" : "카카오 계정으로 로그인"}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-6 py-3.5 min-h-[48px] text-base font-semibold text-[#000000] shadow-sm transition-all duration-300 hover:bg-[#FDD835] hover:shadow-lg hover:shadow-[#FEE500]/20 active:bg-[#FBC02D] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
      >
      {isLoggingIn ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" aria-hidden="true" />
          <span>잠시만 기다려주세요...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
          </svg>
          <span>카카오로 3초 만에 시작하기</span>
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
