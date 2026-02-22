"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { authForgotPassword, isSupabaseConfigured } from "@/utils/supabase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !email.includes(".")) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await authForgotPassword(email.toLowerCase().trim());
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "오류가 발생했습니다. 다시 시도해주세요.");
      return;
    }
    setSent(true);
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
        {/* Logo */}
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1b1b1f" }}>FieldNine</span>
        </Link>

        {sent ? (
          /* Success screen */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1b1b1f", marginBottom: 10 }}>
              이메일을 확인해주세요
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
              <strong style={{ color: "#1b1b1f" }}>{email}</strong>로<br />
              비밀번호 재설정 링크를 보냈습니다.<br />
              링크를 클릭해 새 비밀번호를 설정하세요.
            </p>
            <div style={{
              padding: "12px 16px", background: "#fff7ed", borderRadius: 8,
              border: "1px solid #fed7aa", fontSize: 13, color: "#92400e", marginBottom: 24,
            }}>
              이메일이 안 보이면 스팸 폴더를 확인해주세요.
            </div>
            {!isSupabaseConfigured() && (
              <div style={{
                padding: "10px 14px", borderRadius: 8,
                background: "#fffbeb", border: "1px solid #fde68a",
                fontSize: 12, color: "#92400e", marginBottom: 16, textAlign: "left",
              }}>
                💡 <strong>개발 모드:</strong> Supabase 미연결 상태입니다. 실제 이메일은 발송되지 않습니다.
              </div>
            )}
            <Link href="/login" style={{
              display: "block", padding: "11px 0", borderRadius: 9, textAlign: "center",
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              로그인 페이지로 →
            </Link>
          </div>
        ) : (
          /* Form */
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1b1b1f", marginBottom: 8 }}>
              비밀번호 재설정
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
              가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
            </p>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
                  이메일 Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 14px",
                    borderRadius: 8, fontSize: 14, color: "#1b1b1f", outline: "none",
                    boxSizing: "border-box", background: focused ? "#fff" : "#f9fafb",
                    border: focused ? "1.5px solid #f97316" : "1.5px solid #e5e7eb",
                    transition: "all 0.15s",
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
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
                {loading ? "발송 중..." : "재설정 링크 보내기 →"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link href="/login" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                  ← 로그인으로 돌아가기
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
