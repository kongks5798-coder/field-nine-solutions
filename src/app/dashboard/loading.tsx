export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* 상단 네비게이션 스켈레톤 */}
      <div style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
      }}>
        {/* 로고 */}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #f97316, #f43f5e)",
          opacity: 0.5,
        }} />
        <div style={{
          width: 80, height: 14, borderRadius: 4,
          background: "#e5e7eb",
          animation: "dash-pulse 1.5s ease-in-out infinite",
        }} />
        <div style={{ flex: 1 }} />
        {/* 네비 링크 스켈레톤 */}
        {[60, 60, 60].map((w, i) => (
          <div key={i} style={{
            width: w, height: 14, borderRadius: 4,
            background: "#e5e7eb",
            animation: "dash-pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
        {/* 프로필 아이콘 */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#e5e7eb",
          animation: "dash-pulse 1.5s ease-in-out infinite",
        }} />
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px",
      }}>
        {/* 제목 스켈레톤 */}
        <div style={{
          width: 200, height: 24, borderRadius: 6,
          background: "#e5e7eb",
          animation: "dash-pulse 1.5s ease-in-out infinite",
          marginBottom: 8,
        }} />
        <div style={{
          width: 300, height: 14, borderRadius: 4,
          background: "#f3f4f6",
          animation: "dash-pulse 1.5s ease-in-out infinite",
          marginBottom: 32,
        }} />

        {/* KPI 카드 스켈레톤 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column" as const,
              gap: 12,
            }}>
              <div style={{
                width: 80, height: 12, borderRadius: 3,
                background: "#f3f4f6",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
              <div style={{
                width: 100, height: 28, borderRadius: 6,
                background: "#e5e7eb",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1 + 0.05}s`,
              }} />
              <div style={{
                width: 60, height: 10, borderRadius: 3,
                background: "#f3f4f6",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1 + 0.1}s`,
              }} />
            </div>
          ))}
        </div>

        {/* 프로젝트 목록 스켈레톤 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}>
          <div style={{
            width: 120, height: 18, borderRadius: 4,
            background: "#e5e7eb",
            animation: "dash-pulse 1.5s ease-in-out infinite",
          }} />
          <div style={{
            width: 100, height: 32, borderRadius: 8,
            background: "#e5e7eb",
            animation: "dash-pulse 1.5s ease-in-out infinite",
          }} />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 20,
              display: "flex",
              flexDirection: "column" as const,
              gap: 12,
            }}>
              {/* 프로젝트 아이콘 */}
              <div style={{
                width: "100%", height: 120, borderRadius: 8,
                background: "#f3f4f6",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.08}s`,
              }} />
              {/* 프로젝트 이름 */}
              <div style={{
                width: "70%", height: 14, borderRadius: 4,
                background: "#e5e7eb",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.08 + 0.05}s`,
              }} />
              {/* 날짜 */}
              <div style={{
                width: "40%", height: 10, borderRadius: 3,
                background: "#f3f4f6",
                animation: "dash-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.08 + 0.1}s`,
              }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes dash-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
