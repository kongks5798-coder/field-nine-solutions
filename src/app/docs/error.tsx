"use client";

export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 12,
          padding: 32,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 28,
            color: "#ef4444",
          }}
        >
          !
        </div>
        <h2
          style={{
            color: "#ffffff",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 8px",
          }}
        >
          문서 로딩 오류
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: 14,
            margin: "0 0 8px",
            lineHeight: 1.6,
          }}
        >
          API 문서를 불러오는 중 오류가 발생했습니다.
        </p>
        <p
          style={{
            color: "#64748b",
            fontSize: 12,
            fontFamily: "monospace",
            margin: "0 0 24px",
            wordBreak: "break-all",
          }}
        >
          {error.message}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            background: "#f97316",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ea580c")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
