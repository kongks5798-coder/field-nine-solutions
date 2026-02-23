"use client";

export default function DocsLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07080f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: "3px solid #1e293b",
            borderTop: "3px solid #f97316",
            borderRadius: "50%",
            animation: "docs-spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
          API 문서를 불러오는 중...
        </p>
        <style>{`@keyframes docs-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
