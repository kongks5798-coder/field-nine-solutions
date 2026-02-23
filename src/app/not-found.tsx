import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — 페이지를 찾을 수 없습니다 | Dalkak",
  description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.",
  robots: { index: false, follow: false },
};

/**
 * 404 Not Found — Dalkak branded dark-theme page.
 * Server Component: uses <a> instead of <Link> to avoid RSC event-handler errors.
 */
export default function NotFound() {
  return (
    <div
      style={{
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
      <a
        href="/"
        aria-label="Dalkak 홈으로 이동"
        style={{ textDecoration: "none", marginBottom: 48 }}
      >
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
            margin: "0 auto",
          }}
        >
          D
        </div>
      </a>

      {/* 404 hero text */}
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          lineHeight: 1,
          marginBottom: 20,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "#e8eaf0",
          marginTop: 0,
          marginBottom: 12,
        }}
      >
        페이지를 찾을 수 없습니다
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "#6b7280",
          marginBottom: 40,
          maxWidth: 420,
          lineHeight: 1.8,
        }}
      >
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
        <br />
        주소를 다시 확인하시거나, 아래 버튼으로 홈으로 돌아가세요.
      </p>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <a
          href="/"
          style={{
            padding: "12px 32px",
            borderRadius: 10,
            textDecoration: "none",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
          }}
        >
          홈으로 돌아가기
        </a>
        <a
          href="/workspace"
          style={{
            padding: "12px 32px",
            borderRadius: 10,
            textDecoration: "none",
            border: "1.5px solid #1e293b",
            background: "#111827",
            color: "#e8eaf0",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          워크스페이스
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
    </div>
  );
}
