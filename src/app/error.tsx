"use client";

import { useEffect } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dalkak Error]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
      fontFamily: T.fontStack,
      padding: "24px",
      textAlign: "center",
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: T.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, color: "#fff",
          margin: "0 auto",
        }}>D</div>
      </Link>

      <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1b1b1f", marginBottom: 12 }}>
        오류가 발생했습니다
      </h1>
      <p style={{ fontSize: 15, color: T.muted, marginBottom: 8, maxWidth: 400, lineHeight: 1.7 }}>
        예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      {error.digest && (
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 32 }}>
          오류 코드: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: T.gradient,
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 14px rgba(249,115,22,0.3)`,
          }}
        >
          다시 시도
        </button>
        <Link href="/" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          border: "1.5px solid #e5e7eb",
          background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600,
        }}>
          홈으로
        </Link>
      </div>
    </div>
  );
}
