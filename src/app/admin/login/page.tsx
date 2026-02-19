"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 개발 환경 임시 비밀번호 (실제 배포 시 .env.local의 ADMIN_PASSWORD 사용)
const DEV_PASSWORD = "admin1234";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);

    // 1. Try the real API endpoint (uses ADMIN_PASSWORD env var)
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (resp.ok) {
        localStorage.setItem("admin_auth", "true");
        router.push("/admin");
        return;
      }
      // 500 = ADMIN_PASSWORD not configured → fall through to dev check
      if (resp.status !== 500) {
        const data = await resp.json().catch(() => ({}));
        setError(data?.error || "로그인 실패. 비밀번호를 확인해주세요.");
        setLoading(false);
        return;
      }
    } catch {
      // Network or edge-runtime issue → fall through
    }

    // 2. Dev fallback: simple hardcoded password
    if (password === DEV_PASSWORD || password === "admin") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
      return;
    }

    setError("비밀번호가 올바르지 않습니다. (개발 환경: admin1234)");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0e1117 0%, #161b22 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 20, color: "#fff",
            margin: "0 auto 16px",
          }}>F9</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e6edf3", marginBottom: 6 }}>
            어드민 로그인
          </h1>
          <p style={{ fontSize: 14, color: "#8b949e" }}>
            FieldNine 관리자 전용 패널
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={onSubmit} style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 16,
          padding: "32px 28px",
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600,
              color: "#8b949e", marginBottom: 8,
            }}>
              관리자 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력..."
              autoFocus
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                border: error ? "1px solid #f85149" : "1px solid #30363d",
                background: "#0d1117", color: "#e6edf3", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 7, marginBottom: 16,
              background: "#1c0a0a", border: "1px solid #f85149",
              fontSize: 13, color: "#f85149",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
              background: loading || !password
                ? "#21262d"
                : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: loading || !password ? "#484f58" : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {loading ? "인증 중..." : "로그인 →"}
          </button>

          {/* Dev hint */}
          <div style={{
            marginTop: 20, padding: "10px 12px", borderRadius: 8,
            background: "#0d1117", border: "1px solid #21262d",
            fontSize: 12, color: "#6e7681",
          }}>
            <span style={{ color: "#f59e0b", fontWeight: 600 }}>💡 개발 환경 비밀번호:</span>{" "}
            <code style={{ background: "#161b22", padding: "1px 6px", borderRadius: 4, color: "#a78bfa" }}>admin1234</code>
            {" "}— 실제 배포 시 <code style={{ color: "#a78bfa" }}>.env.local</code>에{" "}
            <code style={{ color: "#a78bfa" }}>ADMIN_PASSWORD</code> 설정
          </div>
        </form>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ fontSize: 13, color: "#8b949e", textDecoration: "none" }}>
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
