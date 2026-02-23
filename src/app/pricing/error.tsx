"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07080f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: '"Pretendard", Inter, sans-serif',
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: 400,
        padding: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>⚠️</div>
        <h2 style={{ color: "#f87171", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          오류가 발생했습니다
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          {error.message || "일시적인 오류가 발생했습니다. 다시 시도해주세요."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #f97316, #f43f5e)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
