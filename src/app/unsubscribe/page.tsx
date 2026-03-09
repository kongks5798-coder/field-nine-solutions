"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");

  const successParam = searchParams.get("success");
  const tokenParam = searchParams.get("token");
  const typeParam = searchParams.get("type") as "marketing" | "all" | null;
  const errorParam = searchParams.get("error");

  useEffect(() => {
    // If already redirected here with ?success=true, just show success
    if (successParam === "true") {
      setStatus("success");
      return;
    }

    // If there's an error param from the GET redirect
    if (errorParam) {
      setStatus("error");
      return;
    }

    // If a raw token is present (user opened the link directly without server redirect),
    // call the POST API from the client
    if (tokenParam) {
      setStatus("loading");
      const type = typeParam ?? "marketing";
      fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenParam, type }),
      })
        .then(async (res) => {
          if (res.ok) {
            setStatus("success");
          } else {
            setStatus("error");
          }
        })
        .catch(() => setStatus("error"));
    }
  }, [successParam, tokenParam, typeParam, errorParam]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#0b0b14",
          borderRadius: 16,
          padding: "48px 40px",
          textAlign: "center",
          border: "1px solid #1e293b",
        }}
      >
        {/* Loading */}
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h1 style={{ color: "#d4d8e2", fontSize: 22, marginBottom: 8 }}>처리 중...</h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>잠시만 기다려주세요.</p>
          </>
        )}

        {/* Idle (no params — e.g., direct navigation) */}
        {status === "idle" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h1 style={{ color: "#d4d8e2", fontSize: 22, marginBottom: 8 }}>이메일 수신 거부</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              이메일에 포함된 수신 거부 링크를 클릭해주세요.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "#1e293b",
                color: "#d4d8e2",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              홈으로 →
            </a>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h1 style={{ color: "#22c55e", fontSize: 22, marginBottom: 8 }}>
              이메일 수신 거부 완료
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 15, marginBottom: 8 }}>
              수신 거부가 완료되었습니다.
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 32 }}>
              언제든지 설정에서 다시 활성화할 수 있어요.
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "linear-gradient(135deg,#f97316,#f43f5e)",
                color: "#fff",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              홈으로 →
            </a>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ color: "#f87171", fontSize: 22, marginBottom: 8 }}>
              링크가 유효하지 않습니다
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 15, marginBottom: 8 }}>
              링크가 만료되었거나 유효하지 않습니다.
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 32 }}>
              문제가 지속되면 지원팀에 문의해주세요.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="mailto:support@fieldnine.io?subject=수신거부 요청"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "#1e293b",
                  color: "#d4d8e2",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                지원팀 연락 →
              </a>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  background: "#0f172a",
                  color: "#94a3b8",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  border: "1px solid #1e293b",
                }}
              >
                홈으로
              </a>
            </div>
          </>
        )}

        {/* Footer */}
        <p style={{ color: "#334155", fontSize: 11, marginTop: 40 }}>
          Dalkak · fieldnine.io ·{" "}
          <a href="/privacy" style={{ color: "#475569", textDecoration: "underline" }}>
            개인정보처리방침
          </a>
        </p>
      </div>
    </div>
  );
}
