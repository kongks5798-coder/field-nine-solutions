"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authSignUp, authSignInWithGitHub, authSignInWithGoogle, isSupabaseConfigured } from "@/utils/supabase/auth";

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
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(null);
  const router = useRouter();
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

  const validate = (): string | null => {
    if (!name.trim()) return "이름을 입력해주세요.";
    if (name.trim().length < 2) return "이름은 2자 이상 입력해주세요.";
    if (!email.includes("@") || !email.includes(".")) return "올바른 이메일 주소를 입력해주세요.";
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
        minHeight: "100vh", background: "#f9fafb", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif', padding: 24,
      }}>
        <div style={{
          maxWidth: 440, width: "100%", background: "#fff",
          borderRadius: 16, padding: "40px 36px", border: "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1b1b1f", marginBottom: 10 }}>
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
      minHeight: "100vh", background: "#f9fafb",
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
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>FieldNine</span>
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
        padding: "48px 24px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1b1b1f", marginBottom: 6 }}>
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
            <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>또는 이메일로 가입</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AuthInput label="이름 Name" value={name} onChange={setName} placeholder="홍길동" autoFocus />
            <AuthInput label="이메일 Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

            <div>
              <AuthInput
                label="비밀번호 Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="6자 이상"
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
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
              label="비밀번호 확인 Confirm"
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
                style={{ marginTop: 2, accentColor: "#f97316", width: 15, height: 15 }}
              />
              <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                <Link href="#" style={{ color: "#f97316", fontWeight: 600 }}>이용약관</Link> 및{" "}
                <Link href="#" style={{ color: "#f97316", fontWeight: 600 }}>개인정보처리방침</Link>에
                동의합니다
              </span>
            </label>

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
              {loading ? "가입 중..." : "무료로 시작하기 →"}
            </button>

            {/* Dev mode notice */}
            {!isSupabaseConfigured() && (
              <div style={{
                padding: "8px 12px", borderRadius: 8,
                background: "#fffbeb", border: "1px solid #fde68a",
                fontSize: 12, color: "#92400e",
              }}>
                💡 <strong>개발 모드:</strong> 실제 Supabase 미연결 → 이메일 인증 없이 바로 가입됩니다.
                실제 서비스는 <code>.env.local</code>에 Supabase 키를 설정하세요.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
