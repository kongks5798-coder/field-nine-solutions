"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function GateInner() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const next = searchParams?.get("next") || "/";
      const res = await fetch(`/api/auth/gate?next=${encodeURIComponent(next)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "비밀번호가 올바르지 않습니다.");
        setShake(true);
        setPassword("");
        setTimeout(() => setShake(false), 600);
        inputRef.current?.focus();
        return;
      }

      // 성공 — 풀 페이지 리로드로 이동 (httpOnly 쿠키 포함 보장)
      window.location.href = data.redirect || "/";
    } catch {
      setLoading(false);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f11 0%, #1a1a22 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, color: "#fff",
          boxShadow: "0 0 40px rgba(249,115,22,0.25)",
        }}>
          F9
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.01em" }}>
          Dalkak
        </div>
        <div style={{
          marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          border: "1px solid rgba(249,115,22,0.3)",
          background: "rgba(249,115,22,0.08)",
          fontSize: 11, fontWeight: 700, color: "#f97316",
          letterSpacing: "0.08em",
        }}>
          PRIVATE BETA
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: "36px 32px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
      }}>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#fff",
          marginBottom: 8, letterSpacing: "-0.02em",
        }}>
          접근 비밀번호 입력
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 28, lineHeight: 1.6 }}>
          현재 비공개 베타 운영 중입니다.<br />
          접근 권한이 있으신 경우 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{
            position: "relative",
            animation: shake ? "shake 0.5s ease" : "none",
          }}>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: error
                  ? "1.5px solid rgba(239,68,68,0.7)"
                  : "1.5px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                outline: "none",
                boxSizing: "border-box",
                letterSpacing: "0.1em",
                transition: "border 0.15s",
              }}
              onFocus={e => {
                e.target.style.border = "1.5px solid rgba(249,115,22,0.6)";
              }}
              onBlur={e => {
                e.target.style.border = error
                  ? "1.5px solid rgba(239,68,68,0.7)"
                  : "1.5px solid rgba(255,255,255,0.12)";
              }}
            />
          </div>

          {error && (
            <div style={{
              marginTop: 10, padding: "9px 14px", borderRadius: 9,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 13, color: "#f87171", display: "flex", alignItems: "center", gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.25" fill="none" stroke="#f87171" strokeWidth="1.5"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            style={{
              marginTop: 16, width: "100%",
              padding: "13px 0", borderRadius: 12, border: "none",
              background: loading || !password.trim()
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: loading || !password.trim()
                ? "rgba(255,255,255,0.3)"
                : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: loading || !password.trim() ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              boxShadow: loading || !password.trim()
                ? "none"
                : "0 4px 20px rgba(249,115,22,0.35)",
            }}
          >
            {loading ? "확인 중..." : "입장하기"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.2)",
        textAlign: "center",
      }}>
        © 2026 FieldNine Inc. · 접근 문의:{" "}
        <a href="mailto:support@fieldnine.io" style={{ color: "rgba(249,115,22,0.5)", textDecoration: "none" }}>
          support@fieldnine.io
        </a>
      </p>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-6px); }
          30%       { transform: translateX(6px); }
          45%       { transform: translateX(-5px); }
          60%       { transform: translateX(5px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #1a1a22 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>
    </div>
  );
}

export default function GatePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", background: "#0f0f11",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 16, color: "#fff",
        }}>F9</div>
      </div>
    }>
      <GateInner />
    </Suspense>
  );
}
