"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dalkak Billing Error]", error);
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
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, color: "#fff",
          margin: "0 auto",
        }}>D</div>
      </Link>

      <div style={{ fontSize: 64, marginBottom: 16 }}>&#9888;&#65039;</div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e8eaf0", marginBottom: 12 }}>
        결제 페이지에서 오류가 발생했습니다
      </h1>
      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 8, maxWidth: 400, lineHeight: 1.7 }}>
        결제 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      {error.digest && (
        <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 32 }}>
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
        <Link href="/dashboard" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          border: "1.5px solid #23263a",
          background: "#12141e", color: "#e8eaf0", fontSize: 15, fontWeight: 600,
        }}>
          대시보드로
        </Link>
      </div>
    </div>
  );
}
