import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | Dalkak",
};

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: "24px",
      textAlign: "center",
    }}>
      {/* Logo */}
      <a href="/" aria-label="Dalkak 홈으로 이동" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div aria-hidden="true" style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, color: "#fff",
          margin: "0 auto",
        }}>D</div>
      </a>

      <div style={{
        fontSize: 96, fontWeight: 900, color: "#1b1b1f",
        lineHeight: 1, marginBottom: 16,
        background: "linear-gradient(135deg, #f97316, #f43f5e)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        404
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1b1b1f", marginBottom: 12 }}>
        페이지를 찾을 수 없어요
      </h1>
      <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 36, maxWidth: 400, lineHeight: 1.7 }}>
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
        홈으로 돌아가서 다시 시작해보세요.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          color: "#fff", fontSize: 15, fontWeight: 700,
          boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
        }}>
          홈으로 가기
        </a>
        <a href="/workspace" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          border: "1.5px solid #e5e7eb",
          background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600,
        }}>
          워크스페이스
        </a>
      </div>
    </div>
  );
}
