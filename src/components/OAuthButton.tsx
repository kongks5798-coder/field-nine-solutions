"use client";

import { useState } from "react";
import { authSignInWithGoogle, authSignInWithKakao, authSignInWithGitHub } from "@/utils/supabase/auth";

export type OAuthProvider = "google" | "kakao" | "github";

interface OAuthButtonProps {
  provider: OAuthProvider;
  label?: string;
  onError?: (msg: string) => void;
}

const PROVIDER_CONFIG: Record<
  OAuthProvider,
  { defaultLabel: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  google: {
    defaultLabel: "Google로 계속하기",
    bg: "#fff",
    color: "#374151",
    border: "1.5px solid #e5e7eb",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
  },
  kakao: {
    defaultLabel: "카카오로 계속하기",
    bg: "#FEE500",
    color: "#3C1E1E",
    border: "1.5px solid #FEE500",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E" aria-hidden="true">
        <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.57 1.453 4.833 3.656 6.27L4.5 21l4.344-2.562C9.55 18.8 10.76 19 12 19c5.523 0 10-3.477 10-8.5S17.523 3 12 3z"/>
      </svg>
    ),
  },
  github: {
    defaultLabel: "GitHub로 계속하기",
    bg: "#24292f",
    color: "#fff",
    border: "1.5px solid #24292f",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
};

const AUTH_FNS: Record<OAuthProvider, () => Promise<{ ok: boolean; error?: string }>> = {
  google: authSignInWithGoogle,
  kakao: authSignInWithKakao,
  github: authSignInWithGitHub,
};

/**
 * OAuthButton — reusable social login button.
 * Delegates to the existing authSignInWith* utilities in /utils/supabase/auth.
 */
export function OAuthButton({ provider, label, onError }: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const cfg = PROVIDER_CONFIG[provider];

  const handleClick = async () => {
    setLoading(true);
    const result = await AUTH_FNS[provider]();
    if (!result.ok) {
      onError?.(result.error ?? `${provider} 로그인 실패`);
      setLoading(false);
    }
    // On success the browser redirects — no need to setLoading(false)
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label ?? cfg.defaultLabel}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 9,
        cursor: loading ? "not-allowed" : "pointer",
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        fontSize: 14,
        fontWeight: 600,
        opacity: loading ? 0.65 : 1,
        transition: "opacity 0.15s",
        minHeight: 48,
      }}
    >
      {cfg.icon}
      {loading ? "연결 중..." : (label ?? cfg.defaultLabel)}
    </button>
  );
}
