"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { Loader2 } from "lucide-react";

interface KakaoLoginButtonProps {
  redirectTo?: string;
  className?: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

// 카카오 공식 디자인 가이드 상수
const KAKAO_DESIGN = {
  COLOR: {
    PRIMARY: "#FEE500",
    HOVER: "#FDD835",
    ACTIVE: "#FBC02D",
    TEXT: "#000000",
  },
  MIN_HEIGHT: "48px", // 카카오 공식 가이드: 최소 48px
  PADDING: {
    X: "px-6",
    Y: "py-3.5",
  },
} as const;

export default function KakaoLoginButton({
  redirectTo = "/dashboard",
  className = "",
  onError,
  onSuccess,
}: KakaoLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // SSR 환경 대응: window 객체 체크
  const isClient = typeof window !== "undefined";

  // 타임아웃 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleKakaoLogin = useCallback(async () => {
    if (!isClient) {
      console.warn("KakaoLoginButton: window 객체가 없습니다. 클라이언트 환경에서만 작동합니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            // 카카오 추가 옵션 (필요시)
            prompt: "select_account",
          },
        },
      });

      if (authError) {
        // 에러 타입별 세분화 처리
        let errorMessage = "카카오 로그인 중 오류가 발생했습니다.";

        if (authError.message.includes("provider") || authError.message.includes("configuration")) {
          errorMessage = "카카오 로그인을 사용하려면 관리자 콘솔에서 API 키 설정이 필요합니다.";
        } else if (authError.message.includes("network") || authError.message.includes("fetch")) {
          errorMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
        } else if (authError.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        } else if (authError.message.includes("popup")) {
          errorMessage = "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.";
        }

        setError(errorMessage);

        if (onError) {
          onError(errorMessage);
        } else {
          // alert 대신 console.error (프로덕션에서는 Toast 사용 권장)
          console.error("[KakaoLoginButton]", authError);
        }

        setLoading(false);
        return;
      }

      // 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      // OAuth는 리다이렉트되므로 로딩 상태는 유지
      // 사용자가 로그인 창을 닫으면 이 함수가 다시 호출되지 않으므로
      // 타임아웃을 설정하여 로딩 상태 해제
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 30000); // 30초 타임아웃
    } catch (err) {
      // 타입 안전한 에러 처리
      const errorMessage =
        err instanceof Error
          ? `소셜 로그인 중 오류가 발생했습니다: ${err.message}`
          : "소셜 로그인 중 알 수 없는 오류가 발생했습니다.";

      setError(errorMessage);
      setLoading(false);

      if (onError) {
        onError(errorMessage);
      } else {
        console.error("[KakaoLoginButton]", err);
      }
    }
  }, [isClient, redirectTo, onError, onSuccess]);

  // 카카오 공식 아이콘 SVG (정확한 path)
  const kakaoIcon = useMemo(
    () => (
      <svg
        className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
      </svg>
    ),
    []
  );

  return (
    <button
      onClick={handleKakaoLogin}
      disabled={loading || !isClient}
      aria-label={loading ? "카카오 로그인 진행 중" : "카카오 계정으로 로그인"}
      aria-busy={loading}
      className={`
        group
        relative
        w-full
        ${KAKAO_DESIGN.PADDING.X}
        ${KAKAO_DESIGN.PADDING.Y}
        min-h-[48px]
        bg-[#FEE500]
        hover:bg-[#FDD835]
        active:bg-[#FBC02D]
        text-[#000000]
        font-semibold
        text-base
        rounded-lg
        transition-all
        duration-300
        ease-out
        flex
        items-center
        justify-center
        gap-3
        shadow-sm
        hover:shadow-lg
        hover:shadow-[#FEE500]/20
        disabled:opacity-60
        disabled:cursor-not-allowed
        disabled:pointer-events-none
        transform
        hover:scale-[1.02]
        active:scale-[0.98]
        focus:outline-none
        focus:ring-2
        focus:ring-[#FEE500]
        focus:ring-offset-2
        focus:ring-offset-white
        ${error ? "ring-2 ring-red-500" : ""}
        ${className}
      `}
    >
      {/* 로딩 Spinner */}
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" aria-hidden="true" />
          <span className="relative z-10">잠시만 기다려주세요...</span>
        </>
      ) : (
        <>
          {kakaoIcon}
          <span className="relative z-10">카카오로 3초 만에 시작하기</span>
        </>
      )}

      {/* 에러 메시지 (선택적 표시) */}
      {error && !loading && (
        <span className="sr-only" role="alert">
          {error}
        </span>
      )}
    </button>
  );
}
