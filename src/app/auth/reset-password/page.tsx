"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAuthClient } from "@/utils/supabase/auth";

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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const pwStrength = getPasswordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
    setError(null);
    setLoading(true);
    const supabase = createAuthClient();
    if (supabase) {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError("비밀번호 변경 실패: " + err.message);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif', padding: 24,
    }}>
      <div style={{
        maxWidth: 440, width: "100%", background: "#fff",
        borderRadius: 16, padding: "40px 36px", border: "1px solid #e5e7eb",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1b1b1f" }}>Dalkak</span>
        </Link>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1b1b1f", marginBottom: 10 }}>
              비밀번호 변경 완료!
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
              새 비밀번호로 변경되었습니다.<br />
              로그인 페이지로 이동 중...
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1b1b1f", marginBottom: 8 }}>
              새 비밀번호 설정
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28 }}>
              사용할 새 비밀번호를 입력해주세요.
            </p>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
                  새 비밀번호
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="6자 이상"
                    autoFocus
                    style={{
                      width: "100%", padding: "10px 44px 10px 14px",
                      borderRadius: 8, fontSize: 14, color: "#1b1b1f", outline: "none",
                      boxSizing: "border-box", background: "#f9fafb",
                      border: "1.5px solid #e5e7eb", transition: "all 0.15s",
                    }}
                    onFocus={e => (e.target.style.border = "1.5px solid #f97316")}
                    onBlur={e => (e.target.style.border = "1.5px solid #e5e7eb")}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    border: "none", background: "none", cursor: "pointer",
                    fontSize: 14, color: "#9ca3af", padding: 0,
                  }}>
                    {showPw ? "숨김" : "보기"}
                  </button>
                </div>
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
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
                  비밀번호 확인
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="비밀번호 재입력"
                    style={{
                      width: "100%", padding: confirm ? "10px 44px 10px 14px" : "10px 14px",
                      borderRadius: 8, fontSize: 14, color: "#1b1b1f", outline: "none",
                      boxSizing: "border-box", background: "#f9fafb",
                      border: "1.5px solid #e5e7eb", transition: "all 0.15s",
                    }}
                    onFocus={e => (e.target.style.border = "1.5px solid #f97316")}
                    onBlur={e => (e.target.style.border = "1.5px solid #e5e7eb")}
                  />
                  {confirm && (
                    <span style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16,
                    }}>
                      {password === confirm ? "✅" : "❌"}
                    </span>
                  )}
                </div>
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
                {loading ? "변경 중..." : "비밀번호 변경 →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
