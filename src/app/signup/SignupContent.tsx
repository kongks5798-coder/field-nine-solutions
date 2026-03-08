"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authSignUp, authSignInWithGitHub, authSignInWithGoogle, authSignInWithKakao } from "@/utils/supabase/auth";

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "매우 약함", color: "#ef4444" },
    { label: "약함", color: "#f97316" },
    { label: "보통", color: "#eab308" },
    { label: "강함", color: "#22c55e" },
    { label: "매우 강함", color: "#16a34a" },
  ];
  return { score, ...map[score] };
}

// ─── Input component ──────────────────────────────────────────────────────────

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
      <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
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

// ─── Mobile logo ──────────────────────────────────────────────────────────────

function MobileLogo({ isDark }: { isDark: boolean }) {
  return (
    <div className="auth-mobile-logo" style={{ display: "none", marginBottom: 28 }}>
      <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 15, color: "#fff",
        }}>D</div>
        <span style={{ fontWeight: 800, fontSize: 18, color: isDark ? "#e8eaf0" : "#1b1b1f" }}>Dalkak</span>
      </a>
      <style>{`@media (max-width: 768px) { .auth-mobile-logo { display: flex !important; } }`}</style>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyScreen, setVerifyScreen] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | "kakao" | null>(null);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);

    // Persist referral code from URL into a cookie so the auth callback can read it
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Za-z0-9]{8}$/.test(ref)) {
      document.cookie = `ref_code=${ref.toUpperCase()};path=/;max-age=3600;SameSite=Lax`;
    }

    return () => mq.removeEventListener("change", handler);
  }, []);
  const pwStrength = getPasswordStrength(password);

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

  const validate = (): string | null => {
    if (!name.trim()) return "이름을 입력해주세요.";
    if (name.trim().length < 2) return "이름은 2자 이상 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 주소를 입력해주세요.";
    if (password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";
    if (password !== confirm) return "비밀번호가 일치하지 않습니다.";
    if (!agreed) return "이용약관에 동의해주세요.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    const result = await authSignUp(name.trim(), email.toLowerCase().trim(), password);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    if (result.needsVerification) { setVerifyScreen(true); return; }
    router.push("/workspace");
  };

  // ── Email verification screen ─────────────────────────────────────────────
  if (verifyScreen) {
    return (
      <div style={{
        minHeight: "100vh", background: isDark ? "#07080f" : "#f9fafb", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif', padding: 24,
      }}>
        <div style={{
          maxWidth: 440, width: "100%", background: isDark ? "#111827" : "#fff",
          borderRadius: 16, padding: "40px 36px", border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: isDark ? "#e8eaf0" : "#1b1b1f", marginBottom: 10 }}>
            이메일을 확인해주세요
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
            <strong style={{ color: "#1b1b1f" }}>{email}</strong>로<br />
            인증 링크를 보냈습니다.<br />
            링크를 클릭하면 자동으로 로그인됩니다.
          </p>
          <div style={{
            padding: "12px 16px", background: "#fff7ed", borderRadius: 8,
            border: "1px solid #fed7aa", fontSize: 13, color: "#92400e", marginBottom: 24,
          }}>
            이메일이 안 보이면 스팸 폴더를 확인해주세요.
          </div>
          <Link href="/login" style={{
            display: "block", padding: "11px 0", borderRadius: 9, textAlign: "center",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            로그인 페이지로 →
          </Link>
        </div>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: isDark ? "#07080f" : "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      display: "flex",
    }}>
      {/* Left brand panel (hidden on mobile) */}
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
          }}>D</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>Dalkak</span>
        </Link>

        <div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 16 }}>
            AI로 모든 것을<br />만들어드립니다
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 32 }}>
            코드, 디자인, 문서, 비즈니스 로직 —<br />
            무엇이든 AI가 즉시 만들어줍니다.
          </p>
          {[
            { icon: "🤖", text: "GPT-4 / Claude / Gemini 멀티 AI" },
            { icon: "👥", text: "팀 실시간 협업 & 채팅" },
            { icon: "☁️", text: "클라우드 파일 관리 100GB" },
            { icon: "📝", text: "AI 문서 자동 생성 & 편집" },
            { icon: "🔒", text: "엔터프라이즈급 보안" },
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
        padding: "48px 24px", overflowY: "auto", minWidth: 0,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <MobileLogo isDark={isDark} />
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: isDark ? "#e8eaf0" : "#1b1b1f", marginBottom: 6 }}>
              계정 만들기
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              이미 계정이 있으신가요?{" "}
              <Link href="/login" style={{ color: "#f97316", fontWeight: 600, textDecoration: "none" }}>
                로그인 →
              </Link>
            </p>
          </div>

          {/* Social login */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <button
              onClick={handleKakao}
              disabled={!!oauthLoading}
              aria-label="카카오로 가입하기"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0", borderRadius: 9, border: "1.5px solid #FEE500",
                background: "#FEE500", fontSize: 14, fontWeight: 700, color: "#3C1E1E",
                cursor: oauthLoading ? "not-allowed" : "pointer", width: "100%",
                opacity: oauthLoading === "kakao" ? 0.6 : 1, transition: "opacity 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.57 1.453 4.833 3.656 6.27L4.5 21l4.344-2.562C9.55 18.8 10.76 19 12 19c5.523 0 10-3.477 10-8.5S17.523 3 12 3z"/>
              </svg>
              {oauthLoading === "kakao" ? "연결 중..." : "카카오로 계속하기"}
            </button>
            <button
              disabled
              aria-label="네이버로 가입하기 (출시 예정)"
              title="네이버 로그인 출시 예정"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0", borderRadius: 9, border: "1.5px solid #03C75A",
                background: "#03C75A", fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: "not-allowed", width: "100%", opacity: 0.55, position: "relative",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
              </svg>
              네이버로 계속하기
              <span style={{ position: "absolute", right: 12, fontSize: 10, background: "rgba(0,0,0,0.25)", borderRadius: 4, padding: "1px 5px" }}>출시 예정</span>
            </button>
            <button
              onClick={handleGoogle}
              disabled={!!oauthLoading}
              aria-label="Google로 가입하기"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 0", borderRadius: 9,
                border: isDark ? "1.5px solid #374151" : "1.5px solid #e5e7eb",
                background: isDark ? "#111827" : "#fff",
                fontSize: 14, fontWeight: 600,
                color: isDark ? "#e8eaf0" : "#374151",
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
              aria-label="GitHub로 가입하기"
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
            <div style={{ flex: 1, height: 1, background: isDark ? "#374151" : "#e5e7eb" }} />
            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>또는 이메일로 가입</span>
            <div style={{ flex: 1, height: 1, background: isDark ? "#374151" : "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} autoComplete="on" aria-label="회원가입" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AuthInput label="이름" value={name} onChange={setName} placeholder="홍길동" autoFocus />
            <AuthInput label="이메일" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <AuthInput
                label="비밀번호"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="6자 이상"
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"} style={{
                    border: "none", background: "none", cursor: "pointer",
                    fontSize: 14, color: "#9ca3af", padding: 0,
                  }}>
                    {showPw ? "숨김" : "보기"}
                  </button>
                }
              />
              {/* Password strength bar */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 9999,
                        background: i < pwStrength.score ? pwStrength.color : "#e5e7eb",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: pwStrength.color, fontWeight: 500 }}>
                    비밀번호 강도: {pwStrength.label}
                    {pwStrength.score < 3 && " — 대문자·숫자·특수문자를 추가하면 더 안전합니다"}
                  </div>
                </div>
              )}
            </div>

            <AuthInput
              label="비밀번호 확인"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="비밀번호 재입력"
              rightEl={
                confirm ? (
                  <span style={{ fontSize: 16 }}>{password === confirm ? "✅" : "❌"}</span>
                ) : undefined
              }
            />

            {/* Terms */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                aria-label="이용약관 및 개인정보처리방침 동의"
                style={{ marginTop: 2, accentColor: "#f97316", width: 15, height: 15 }}
              />
              <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                <Link href="/terms" target="_blank" rel="noopener" style={{ color: "#f97316", fontWeight: 600 }}>이용약관</Link> 및{" "}
                <Link href="/privacy" target="_blank" rel="noopener" style={{ color: "#f97316", fontWeight: 600 }}>개인정보처리방침</Link>에
                동의합니다
              </span>
            </label>

            {/* 데이터 수집 고지 */}
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              fontSize: 12, color: "#166534", lineHeight: 1.6,
            }}>
              📊 서비스 품질 개선을 위해 앱 사용 패턴(생성 횟수, 기능 사용 현황 등)이 수집됩니다. 개인 식별 정보는 포함되지 않으며, 더 나은 서비스 제공 목적으로만 사용됩니다.
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: "#fef2f2", border: "1px solid #fecaca",
                  fontSize: 13, color: "#dc2626", display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span aria-hidden="true">⚠️</span> {error}
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
              {loading ? "가입 중..." : "무료로 시작하기 →"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
