"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/utils/supabase/client";
import Toast from "@/app/components/Toast";
import { Mail, Lock, Loader2 } from "lucide-react";
import { ensureProfile } from "@/src/utils/profile";
import { ensureUser } from "@/src/utils/user";
import { validateEmail, validatePassword } from "@/src/utils/validation";
import { logger } from "@/src/utils/logger";

function LoginForm() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const hasRedirected = useRef(false); // 중복 리다이렉트 방지
  const supabase = createClient();

  // showToast 함수를 useCallback으로 안정화 (의존성 문제 해결)
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  // 세션 확인 함수 (먼저 정의)
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) {
        router.replace(redirectTo);
      }
    } catch (error) {
      // Silent fail for session check
      console.error('[LoginPage] 세션 확인 오류:', error);
    }
  }, [supabase, router, redirectTo]);

  // 초기 세션 확인 및 에러 처리
  useEffect(() => {
    setMounted(true);
    checkSession();
    
    // 콜백에서 전달된 에러 처리
    const error = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    
    if (error) {
      let message = "로그인 중 오류가 발생했습니다.";
      
      if (error === "oauth_error") {
        message = errorMessage || "소셜 로그인 중 오류가 발생했습니다.";
      } else if (error === "provider_not_enabled") {
        message = errorMessage || "OAuth 프로바이더가 활성화되지 않았습니다. Supabase 대시보드에서 프로바이더를 활성화해주세요.";
      } else if (error === "oauth_config_error") {
        message = errorMessage || "OAuth 설정이 완료되지 않았습니다. Client ID와 Secret을 확인해주세요.";
      } else if (error === "no_code") {
        message = "인증 코드를 받지 못했습니다. 다시 시도해주세요.";
      } else if (error === "session_exchange_failed") {
        message = errorMessage || "세션 생성에 실패했습니다. 다시 시도해주세요.";
      } else if (error === "no_session") {
        message = "로그인 세션이 생성되지 않았습니다. 다시 시도해주세요.";
      } else if (error === "unexpected_error") {
        message = "예상치 못한 오류가 발생했습니다. 다시 시도해주세요.";
      } else if (error === "session_expired") {
        message = "세션이 만료되었습니다. 다시 로그인해주세요.";
      } else if (error === "configuration_error") {
        message = errorMessage || "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.";
      } else if (error === "rate_limit_exceeded") {
        message = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      }
      
      showToast(message, "error");
    }
  }, [searchParams, showToast, checkSession]);

  // Auth Watcher (CCTV) - SIGNED_IN 상태 감지 시 강제 리다이렉트
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && !hasRedirected.current) {
        hasRedirected.current = true;
        // 강제 리다이렉트 (이중 안전장치)
        router.replace(redirectTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo, supabase]);

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    try {
      setLoading(true);

      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
        : `/auth/callback?next=${encodeURIComponent(redirectTo)}`;

      if (provider === "google") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          console.error('[Login] Google OAuth 에러:', error);
          let errorMessage = "Google 로그인 중 오류가 발생했습니다.";
          
          if (error.message.includes("unsupported_provider") || error.message.includes("provider is not enabled")) {
            errorMessage = "Google 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Google 프로바이더를 활성화해주세요.";
          } else if (error.message.includes("missing_auth_secret") || error.message.includes("configuration")) {
            errorMessage = "Google OAuth 설정이 완료되지 않았습니다. Supabase 대시보드에서 Client ID와 Secret을 설정해주세요.";
          } else if (error.message.includes("redirect_uri_mismatch")) {
            errorMessage = "리다이렉트 URL이 일치하지 않습니다. Google Cloud Console과 Supabase 설정을 확인해주세요.";
          }
          
          showToast(errorMessage, "error");
          setLoading(false);
        }
        // OAuth는 리다이렉트되므로 로딩 상태는 유지
      } else if (provider === "kakao") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "kakao",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          console.error('[Login] Kakao OAuth 에러:', error);
          let errorMessage = "Kakao 로그인 중 오류가 발생했습니다.";
          
          if (error.message.includes("unsupported_provider") || error.message.includes("provider is not enabled")) {
            errorMessage = "Kakao 로그인이 활성화되지 않았습니다. Supabase 대시보드에서 Kakao 프로바이더를 활성화해주세요.";
          } else if (error.message.includes("no_relation_for_ref") || error.message.includes("configuration")) {
            errorMessage = "Kakao OAuth 설정이 완료되지 않았습니다. Supabase 대시보드에서 Client ID와 Secret을 설정해주세요.";
          } else if (error.message.includes("redirect_uri_mismatch")) {
            errorMessage = "리다이렉트 URL이 일치하지 않습니다. Kakao Developers와 Supabase 설정을 확인해주세요.";
          }
          
          showToast(errorMessage, "error");
          setLoading(false);
        }
        // OAuth는 리다이렉트되므로 로딩 상태는 유지
      }
    } catch (err: any) {
      showToast("소셜 로그인 중 오류가 발생했습니다.", "error");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    hasRedirected.current = false; // 리다이렉트 플래그 리셋

    try {
      if (isSignUp) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        // 에러가 있으면 throw하여 성공 메시지가 뜨지 않도록
        if (error) {
          throw error;
        }

        // !error일 때만 성공 처리
        if (data.user) {
          // 프로필 자동 생성 (공통 함수 사용)
          // public.users 테이블에 유저 생성
          await ensureUser(supabase, {
            userId: data.user.id,
            email: data.user.email,
            avatarUrl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          });

          // profiles 테이블에도 프로필 생성 (기존 호환성 유지)
          await ensureProfile(supabase, {
            userId: data.user.id,
            email: data.user.email,
            role: "employee",
          });

          // Confirm Email이 꺼져 있으면 즉시 세션이 생성됨
          if (data.session) {
            showToast("환영합니다!", "success");
            
            // 블록체인에 회원가입 기록 저장 (비동기, 실패해도 가입은 계속 진행)
            try {
              fetch('/api/blockchain/store-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: data.user.id,
                  action: 'signup',
                  metadata: { method: 'email' },
                }),
              }).catch(err => console.warn('[Signup] 블록체인 저장 실패 (무시됨):', err));
            } catch (error) {
              console.warn('[Signup] 블록체인 저장 오류 (무시됨):', error);
            }
            
            router.refresh();
            
            // 명시적 리다이렉트 (이중 안전장치)
            setTimeout(() => {
              if (!hasRedirected.current) {
                hasRedirected.current = true;
                router.replace(redirectTo);
              }
            }, 1000); // 1초 내 화면 전환
          } else {
            // 세션이 없으면 가입 완료 후 로그인 화면으로 전환
            showToast("회원가입이 완료되었습니다. 로그인해주세요.", "success");
            setIsSignUp(false);
            setPassword("");
            setLoading(false);
          }
        }
      } else {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // 에러가 있으면 throw하여 성공 메시지가 뜨지 않도록
        if (error) {
          throw error;
        }

        // !error일 때만 성공 처리
        if (data.session) {
          // public.users 테이블에 유저 생성
          await ensureUser(supabase, {
            userId: data.user.id,
            email: data.user.email,
            avatarUrl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          });

          // profiles 테이블에도 프로필 생성 (기존 호환성 유지)
          await ensureProfile(supabase, {
            userId: data.user.id,
            email: data.user.email,
            role: "employee",
          });

          showToast("환영합니다!", "success");
          
          // 블록체인에 인증 기록 저장 (비동기, 실패해도 로그인은 계속 진행)
          try {
            fetch('/api/blockchain/store-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                action: 'login',
                metadata: { method: 'email' },
              }),
            }).catch(err => console.warn('[Login] 블록체인 저장 실패 (무시됨):', err));
          } catch (error) {
            console.warn('[Login] 블록체인 저장 오류 (무시됨):', error);
          }
          
          router.refresh();
          
          // 명시적 리다이렉트 (이중 안전장치)
          setTimeout(() => {
            if (!hasRedirected.current) {
              hasRedirected.current = true;
              router.replace(redirectTo);
            }
          }, 1000); // 1초 내 화면 전환
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      // Supabase 원본 에러 메시지 노출 금지
      if (error.message?.includes("Invalid login credentials") || error.message?.includes("Invalid credentials")) {
        showToast("이메일/비밀번호를 다시 확인해주세요.", "error");
      } else if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
        showToast("이미 가입된 이메일입니다. 로그인해주세요.", "error");
        setIsSignUp(false);
      } else {
        showToast(
          isSignUp 
            ? "회원가입에 실패했습니다. 다시 시도해주세요." 
            : "이메일/비밀번호를 다시 확인해주세요.",
          "error"
        );
      }
      setLoading(false);
    } finally {
      // 세션이 생성되지 않은 경우에만 로딩 해제
      // 세션이 생성된 경우는 Auth Watcher가 리다이렉트 처리
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && !hasRedirected.current) {
          setLoading(false);
        }
      }, 500);
    }
  };

  return (
    <div className="bg-[#F9F9F7] text-[#171717] min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 미니멀한 로그인 카드 - 테슬라 럭셔리 스타일 */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="bg-white border border-[#E5E5E0] rounded-2xl p-10 sm:p-12 shadow-xl shadow-black/5">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 32 32" 
                fill="none"
                className="mr-2"
              >
                <rect 
                  x="4" 
                  y="4" 
                  width="24" 
                  height="24" 
                  stroke="#1A5D3F" 
                  strokeWidth="1.5"
                />
                <rect 
                  x="8" 
                  y="8" 
                  width="16" 
                  height="16" 
                  stroke="#1A5D3F" 
                  strokeWidth="1"
                  opacity="0.6"
                />
                <circle 
                  cx="16" 
                  cy="16" 
                  r="3" 
                  fill="#1A5D3F"
                  opacity="0.8"
                />
              </svg>
              <h1 className="text-3xl font-bold text-[#171717] tracking-tight">
                Field <span className="text-[#1A5D3F]">Nine</span>
              </h1>
            </div>
            <p className="text-[#6B6B6B] text-sm font-light">
              {isSignUp ? "새로운 계정을 만드세요" : "돌아오신 것을 환영합니다"}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-8">
            {/* Google Login */}
            <button
              onClick={() => handleSocialLogin("google")}
              disabled={loading}
              className="w-full px-6 py-3.5 bg-white border border-[#D4D4D4] hover:border-[#A3A3A3] text-[#171717] font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{loading ? "연결 중..." : "Google 계정으로 계속하기"}</span>
            </button>

            {/* Kakao Login */}
            <button
              onClick={() => handleSocialLogin("kakao")}
              disabled={loading}
              aria-label={loading ? "Kakao 로그인 진행 중" : "Kakao 계정으로 로그인"}
              aria-busy={loading ? true : undefined}
              className="w-full px-6 py-3.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] font-medium rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSocialLogin("kakao");
                }
              }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
              </svg>
              <span>Kakao로 3초 만에 시작하기</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E0]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#6B6B6B] font-light">또는</span>
            </div>
          </div>

          {/* Email/Password Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[#171717]">
                이메일 주소
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-[#171717] placeholder-[#9CA3AF] transition-all duration-200 hover:border-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-[#171717]">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-[#171717] placeholder-[#9CA3AF] transition-all duration-200 hover:border-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 bg-white border-[#E5E5E0] rounded focus:ring-green-500 focus:ring-2 text-green-600 cursor-pointer transition-all duration-200"
                  />
                  <span className="ml-2 text-sm text-[#6B6B6B] group-hover:text-[#171717] transition-colors">
                    로그인 상태 유지
                  </span>
                </label>
                <Link 
                  href="#" 
                  className="text-sm text-[#6B6B6B] hover:text-[#1A5D3F] transition-colors duration-200"
                >
                  비밀번호 찾기
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? (isSignUp ? "회원가입 중" : "로그인 중") : (isSignUp ? "회원가입" : "로그인")}
              aria-busy={loading ? true : undefined}
              className="w-full px-6 py-3.5 bg-[#171717] hover:bg-[#000000] text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>{isSignUp ? "가입 중..." : "로그인 중..."}</span>
                </>
              ) : (
                <span>{isSignUp ? "회원가입" : "로그인"}</span>
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-8 pt-6 border-t border-[#E5E5E0] text-center">
            <p className="text-sm text-[#6B6B6B]">
              {isSignUp ? "이미 계정이 있으신가요? " : "아직 계정이 없으신가요? "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword("");
                }}
                disabled={loading}
                className="text-[#1A5D3F] hover:text-[#0F4A2F] font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                {isSignUp ? "로그인" : "회원가입"}
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {isSignUp ? "회원가입" : "로그인"} 시{" "}
              <Link href="#" className="text-[#1A5D3F] hover:text-[#0F4A2F] transition-colors duration-200">
                이용약관
              </Link>
              {" "}및{" "}
              <Link href="#" className="text-[#1A5D3F] hover:text-[#0F4A2F] transition-colors duration-200">
                개인정보처리방침
              </Link>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#F9F9F7] text-[#171717] min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#E5E5E0]"></div>
          <p className="text-[#6B6B6B]">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
