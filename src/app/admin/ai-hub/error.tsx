"use client";

export default function AiHubError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "#07080f",
        color: "#f87171",
        fontFamily: '"Pretendard", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        gap: 16,
      }}
    >
      <p style={{ fontSize: 16, fontWeight: 700 }}>AI Data Hub 오류</p>
      <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 400, textAlign: "center" }}>
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          borderRadius: 8,
          border: "none",
          background: "#f97316",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
