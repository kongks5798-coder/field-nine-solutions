"use client";

import { useState, useEffect, useId, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  authSignIn,
  authSignInWithGitHub,
  authSignInWithGoogle,
  authSignInWithKakao,
  authSignInWithMagicLink,
} from "@/utils/supabase/auth";

// ─── WebView detection ─────────────────────────────────────────────────────────

function detectWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /KAKAOTALK/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /NAVER/i.test(ua) ||
    /Line\/\d/i.test(ua) ||
    /FB_IAB/i.test(ua) ||
    /FBAN/i.test(ua) ||
    // Android WebView
    (/wv\)/i.test(ua) && /Android/i.test(ua)) ||
    // iOS in-app (no Safari keyword)
    (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua))
  );
}

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// ─── Input component ───────────────────────────────────────────────────────────

function AuthInput({
  label, type = "text", value, onChange, placeholder, autoFocus = false, rightEl,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoFocus?: boolean; rightEl?: React.ReactNode;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: "100%", padding: rightEl ? "11px 44px 11px 14px" : "11px 14px",
            borderRadius: 9, fontSize: 15, color: "#1b1b1f", outline: "none",
            boxSizing: "border-box", background: focused ? "#fff" : "#f9fafb",
            border: focused ? "1.5px solid #f97316" : "1.5px solid #e5e7eb",
            transition: "all 0.15s",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

function LoginPageInner() {
  const [tab, setTab] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | "kakao" | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsWebView(detectWebView());
    setIsMobile(detectMobile());
    // WebView: force magic link tab (OAuth doesn't work)
    if (detectWebView()) setTab("magic");
  }, []);

  // Show error from URL (e.g. auth callback failure)
  useEffect(() => {
    const urlError = searchParams?.get("error");
    if (urlError === "auth_callback_failed") {
      setError("소셜 로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } else if (urlError === "provider_not_enabled") {
      setError("해당 소셜 로그인이 아직 설정되지 않았습니다. 이메일로 로그인해주세요.");
    }
  }, [searchParams]);

  // ── open in external browser ────────────────────────────────────────────────
  const openExternal = () => {
    const url = window.location.href;
    // iOS: intent URI doesn't work — just copy/show
    if (/iPhone|iPad/i.test(navigator.userAgent)) {
      window.open(url, "_blank");
    } else {
      // Android: intent to open in Chrome
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  };

  const handleGitHub = async () => {
    setOauthLoading("github");
    setError(null);
    const result = await authSignInWithGitHub();
    if (!result.ok) { setError(result.error ?? "GitHub 로그인 실패"); setOauthLoading(null); }
  };

  const handleGoogle = async () => {
    setOauthLoading("google");
    setError(null);
    const result = await authSignInWithGoogle();
    if (!result.ok) { setError(result.error ?? "Google 로그인 실패"); setOauthLoading(null); }
  };

  const handleKakao = async () => {
    setOauthLoading("kakao");
    setError(null);
    const result = await authSignInWithKakao();
    if (!result.ok) { setError(result.error ?? "카카오 로그인 실패"); setOauthLoading(null); }
  };

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("올바른 이메일 주소를 입력해주세요."); return;
    }
    if (!password) { setError("비밀번호를 입력해주세요."); return; }
    setError(null);
    setLoading(true);
    const result = await authSignIn(email.toLowerCase().trim(), password);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    const next = searchParams?.get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/workspace");
  };

  const onSubmitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("올바른 이메일 주소를 입력해주세요."); return;
    }
    setError(null);
    setLoading(true);
    const result = await authSignInWithMagicLink(email.toLowerCase().trim());
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "오류가 발생했습니다."); return; }
    setInfo(`${email}로 로그인 링크를 보냈습니다. 이메일을 확인해주세요! 📧`);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      display: "flex",
    }}>
      {/* Left brand panel — hidden on mobile via globals.css */}
      <div
        style={{
          width: 420, flexShrink: 0,
          background: "linear-gradient(135deg, #1b1b1f 0%, #2d2d35 100%)",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "48px 40px",
        }}
        className="auth-left-panel"
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 15, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>FieldNine</span>
        </Link>

        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
            다시 만나서<br />반갑습니다
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
            AI가 여러분의 아이디어를<br />
            현실로 만들어드립니다.
          </p>
          {[
            { icon: "⚡", text: "30초 안에 AI 결과물 생성" },
            { icon: "🔒", text: "엔터프라이즈급 보안" },
            { icon: "🌐", text: "언제 어디서나 접속 가능" },
            { icon: "🤝", text: "팀과 실시간 협업" },
          ].map(f => (
            <div key={f.icon} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{
                width: 32, height: 32, background: "rgba(249,115,22,0.15)",
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>{f.icon}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{f.text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          © 2026 FieldNine Inc. · Seoul, Korea
        </div>
      </div>

      {/* Right form */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px", minWidth: 0,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobile logo (only when left panel is hidden) */}
          <div className="auth-mobile-logo" style={{ display: "none", marginBottom: 28 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 15, color: "#fff",
              }}>F9</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#1b1b1f" }}>FieldNine</span>
            </Link>
          </div>

          {/* ── WebView warning ─────────────────────────────────────────── */}
          {isWebView && (
            <div style={{
              marginBottom: 20, padding: "14px 16px", borderRadius: 12,
              background: "#fff7ed", border: "1.5px solid #fed7aa",
              fontSize: 13, lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 6 }}>
                📱 인앱 브라우저에서는 소셜 로그인이 제한됩니다
              </div>
              <div style={{ color: "#9a3412", marginBottom: 10 }}>
                카카오톡·인스타그램 등 앱 내 브라우저는 Google 정책으로 로그인이 차단됩니다.<br />
                아래 중 하나를 선택해주세요:
              </div>
              <button
                onClick={openExternal}
                style={{
                  display: "block", width: "100%", padding: "10px 0",
                  borderRadius: 8, border: "none", marginBottom: 8,
                  background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                Chrome/Safari로 열기 →
              </button>
              <div style={{ fontSize: 12, color: "#b45309", textAlign: "center" }}>
                또는 아래 <strong>매직 링크 이메일</strong>로 로그인하세요 (앱에서도 작동)
              </div>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1b1b1f", marginBottom: 6 }}>
              다시 오셨군요!
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              계정이 없으신가요?{" "}
              <Link href="/signup" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                무료 가입 →
              </Link>
            </p>
          </div>

          {/* ── Social login (hide in WebView) ─────────────────────────── */}
          {!isWebView && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <button
                  onClick={handleGoogle}
                  disabled={!!oauthLoading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "12px 0", borderRadius: 9, border: "1.5px solid #e5e7eb",
                    background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151",
                    cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                    opacity: oauthLoading === "google" ? 0.6 : 1, transition: "opacity 0.15s",
                    minHeight: 48,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🔵</span>
                  {oauthLoading === "google" ? "연결 중..." : "Google로 계속하기"}
                </button>
                <button
                  onClick={handleKakao}
                  disabled={!!oauthLoading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "12px 0", borderRadius: 9, border: "1.5px solid #FEE500",
                    background: "#FEE500", fontSize: 14, fontWeight: 700, color: "#3C1E1E",
                    cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                    opacity: oauthLoading === "kakao" ? 0.6 : 1, transition: "opacity 0.15s",
                    minHeight: 48,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E">
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.57 1.453 4.833 3.656 6.27L4.5 21l4.344-2.562C9.55 18.8 10.76 19 12 19c5.523 0 10-3.477 10-8.5S17.523 3 12 3z"/>
                  </svg>
                  {oauthLoading === "kakao" ? "연결 중..." : "카카오로 계속하기"}
                </button>
                <button
                  onClick={handleGitHub}
                  disabled={!!oauthLoading}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "12px 0", borderRadius: 9, border: "1.5px solid #24292f",
                    background: "#24292f", fontSize: 14, fontWeight: 600, color: "#fff",
                    cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                    opacity: oauthLoading === "github" ? 0.6 : 1, transition: "opacity 0.15s",
                    minHeight: 48,
                  }}
                >
                  <span style={{ fontSize: 18 }}>⚫</span>
                  {oauthLoading === "github" ? "연결 중..." : "GitHub로 계속하기"}
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>또는 이메일로 로그인</span>
                <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
              </div>
            </>
          )}

          {/* ── Login method tabs ───────────────────────────────────────── */}
          <div style={{
            display: "flex", borderRadius: 10, background: "#f3f4f6",
            padding: 4, marginBottom: 24, gap: 4,
          }}>
            {([
              { key: "password", label: "비밀번호 로그인" },
              { key: "magic", label: isMobile ? "📧 링크로 로그인" : "매직 링크" },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setError(null); setInfo(null); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                  background: tab === t.key ? "#fff" : "transparent",
                  boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  color: tab === t.key ? "#1b1b1f" : "#9ca3af",
                  fontWeight: tab === t.key ? 700 : 500,
                  fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Info / Success message ──────────────────────────────────── */}
          {info && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: "14px 16px", borderRadius: 10, marginBottom: 16,
                background: "#f0fdf4", border: "1.5px solid #bbf7d0",
                fontSize: 14, color: "#166534", lineHeight: 1.6,
              }}
            >
              {info}
            </div>
          )}

          {/* ── Error ──────────────────────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                background: "#fef2f2", border: "1px solid #fecaca",
                fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span aria-hidden="true">⚠️</span> {error}
            </div>
          )}

          {/* ── Password form ───────────────────────────────────────────── */}
          {tab === "password" && (
            <form onSubmit={onSubmitPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AuthInput
                label="이메일"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoFocus
              />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#9ca3af" }}>비밀번호</span>
                  <Link href="/auth/forgot-password" style={{
                    fontSize: 12, color: "#f97316", fontWeight: 600, textDecoration: "none",
                  }}>
                    비밀번호 찾기
                  </Link>
                </div>
                <AuthInput
                  label=""
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="비밀번호 입력"
                  rightEl={
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{
                      border: "none", background: "none", cursor: "pointer",
                      fontSize: 14, color: "#9ca3af", padding: 0,
                    }}>
                      {showPw ? "숨김" : "보기"}
                    </button>
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px 0", borderRadius: 9, border: "none",
                  background: loading ? "#e5e7eb" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: loading ? "#9ca3af" : "#fff",
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(249,115,22,0.3)",
                  transition: "all 0.15s", minHeight: 50,
                }}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          )}

          {/* ── Magic link form ─────────────────────────────────────────── */}
          {tab === "magic" && !info && (
            <form onSubmit={onSubmitMagic} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "#f8fafc", border: "1px solid #e5e7eb",
                fontSize: 13, color: "#6b7280", lineHeight: 1.6,
              }}>
                이메일을 입력하면 <strong style={{ color: "#1b1b1f" }}>클릭 한 번</strong>으로 로그인할 수 있는 링크를 보내드립니다.<br />
                비밀번호가 필요 없어 모바일에서 편리합니다. ✨
              </div>

              <AuthInput
                label="이메일"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoFocus
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px 0", borderRadius: 9, border: "none",
                  background: loading ? "#e5e7eb" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: loading ? "#9ca3af" : "#fff",
                  fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 14px rgba(249,115,22,0.3)",
                  transition: "all 0.15s", minHeight: 50,
                }}
              >
                {loading ? "전송 중..." : "매직 링크 보내기 📧"}
              </button>
            </form>
          )}

          {/* ── After magic link sent ───────────────────────────────────── */}
          {tab === "magic" && info && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <button
                onClick={() => { setInfo(null); setEmail(""); }}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "1px solid #e5e7eb",
                  background: "#fff", fontSize: 14, color: "#6b7280", cursor: "pointer",
                }}
              >
                다른 이메일로 시도
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile logo CSS override */}
      <style>{`
        @media (max-width: 768px) {
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
