"use client";

import { useEffect } from "react";

/**
 * Global error boundary — catches unhandled errors in the root layout.
 * Must be a Client Component and must render its own <html>/<body>.
 * Dark-themed to match the Dalkak brand.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitised error for debugging — full stack stays in console only
    console.error("[GlobalError]", error.digest ?? "no-digest", error.message);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <title>오류 발생 | Dalkak</title>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#07080f",
          fontFamily:
            '"Pretendard", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          padding: "24px",
          textAlign: "center",
          color: "#e8eaf0",
        }}
      >
        {/* Logo */}
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 22,
            color: "#fff",
            marginBottom: 36,
          }}
        >
          D
        </div>

        {/* Warning symbol */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 20,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          !
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#e8eaf0",
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          치명적 오류가 발생했습니다
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#6b7280",
            marginBottom: 8,
            maxWidth: 420,
            lineHeight: 1.8,
          }}
        >
          앱에 예기치 않은 문제가 발생했습니다.
          <br />
          아래 버튼으로 다시 시도하거나, 문제가 지속되면 고객 지원에 문의해주세요.
        </p>

        {/* Show digest code only when available — never expose raw error messages */}
        {error.digest && (
          <p
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 28,
            }}
          >
            오류 코드: {error.digest}
          </p>
        )}

        {!error.digest && <div style={{ marginBottom: 28 }} />}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={reset}
            style={{
              padding: "12px 32px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            }}
          >
            다시 시도
          </button>
          <a
            href="/"
            style={{
              padding: "12px 32px",
              borderRadius: 10,
              textDecoration: "none",
              border: "1.5px solid #1e293b",
              background: "#111827",
              color: "#e8eaf0",
              fontSize: 15,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            홈으로
          </a>
        </div>

        {/* Decorative bottom line */}
        <div
          aria-hidden="true"
          style={{
            marginTop: 64,
            width: 48,
            height: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            opacity: 0.4,
          }}
        />
      </body>
    </html>
  );
}
