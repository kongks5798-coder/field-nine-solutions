"use client";

import { useEffect } from "react";

export default function DelegationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Delegation Error]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#07080f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 20, color: "#fff",
        marginBottom: 32,
      }}>D</div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e8eaf0", marginBottom: 12 }}>
        위임 포탈 오류
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8, maxWidth: 400, lineHeight: 1.7 }}>
        서브 관리자 위임 페이지를 불러오는 중 문제가 발생했습니다.
      </p>
      {error.digest && (
        <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 24 }}>
          오류 코드: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
          }}
        >
          다시 시도
        </button>
        <a href="/admin" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          border: "1.5px solid #23263a",
          background: "#12141e", color: "#e8eaf0", fontSize: 15, fontWeight: 600,
          display: "inline-flex", alignItems: "center",
        }}>
          관리자 홈
        </a>
      </div>
    </div>
  );
}
