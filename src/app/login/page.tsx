"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authSignIn, authSignInWithGitHub, authSignInWithGoogle } from "@/utils/supabase/auth";

// ─── Input component ──────────────────────────────────────────────────────────

function AuthInput({
  label, type = "text", value, onChange, placeholder, autoFocus = false, rightEl,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoFocus?: boolean; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            width: "100%", padding: rightEl ? "10px 44px 10px 14px" : "10px 14px",
            borderRadius: 8, fontSize: 14, color: "#1b1b1f", outline: "none",
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

// ─── Main component ───────────────────────────────────────────────────────────

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show error from URL (e.g. auth callback failure)
  useEffect(() => {
    const urlError = searchParams?.get("error");
    if (urlError === "auth_callback_failed") {
      setError("소셜 로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } else if (urlError === "provider_not_enabled") {
      setError("해당 소셜 로그인이 아직 설정되지 않았습니다. 이메일로 로그인해주세요.");
    }
  }, [searchParams]);

  const handleGitHub = async () => {
    setOauthLoading("github");
    setError(null);
    const result = await authSignInWithGitHub();
    if (!result.ok) { setError(result.error ?? "GitHub 로그인 실패"); setOauthLoading(null); }
    // on success: Supabase redirects to /auth/callback automatically
  };

  const handleGoogle = async () => {
    setOauthLoading("google");
    setError(null);
    const result = await authSignInWithGoogle();
    if (!result.ok) { setError(result.error ?? "Google 로그인 실패"); setOauthLoading(null); }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await authSignIn(email.toLowerCase().trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const next = searchParams?.get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/workspace");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      display: "flex",
    }}>
      {/* Left brand panel */}
      <div style={{
        width: 420, flexShrink: 0, background: "linear-gradient(135deg, #1b1b1f 0%, #2d2d35 100%)",
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
        padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
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

          {/* Social login */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <button
              onClick={handleGoogle}
              disabled={!!oauthLoading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0", borderRadius: 9, border: "1.5px solid #e5e7eb",
                background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151",
                cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                opacity: oauthLoading === "google" ? 0.6 : 1, transition: "opacity 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>🔵</span>
              {oauthLoading === "google" ? "연결 중..." : "Google로 계속하기"}
            </button>
            <button
              onClick={handleGitHub}
              disabled={!!oauthLoading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0", borderRadius: 9, border: "1.5px solid #24292f",
                background: "#24292f", fontSize: 14, fontWeight: 600, color: "#fff",
                cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                opacity: oauthLoading === "github" ? 0.6 : 1, transition: "opacity 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>⚫</span>
              {oauthLoading === "github" ? "연결 중..." : "GitHub로 계속하기"}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>또는 이메일로 로그인</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "#fef2f2", border: "1px solid #fecaca",
                fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 0", borderRadius: 9, border: "none",
                background: loading ? "#e5e7eb" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: loading ? "#9ca3af" : "#fff",
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(249,115,22,0.3)",
                transition: "all 0.15s",
              }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>

          </form>
        </div>
      </div>
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
