export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      background: "#07080f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* 상단 탑바 스켈레톤 */}
      <div style={{
        height: 44,
        background: "#0d0e17",
        borderBottom: "1px solid #1a1c2e",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
      }}>
        {/* 로고 */}
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "linear-gradient(135deg, #f97316, #f43f5e)",
          opacity: 0.7,
        }} />
        {/* 프로젝트 이름 스켈레톤 */}
        <div style={{
          width: 140, height: 14, borderRadius: 4,
          background: "#1a1c2e",
          animation: "dalkak-pulse 1.5s ease-in-out infinite",
        }} />
        <div style={{ flex: 1 }} />
        {/* 버튼 스켈레톤 */}
        {[80, 60, 70].map((w, i) => (
          <div key={i} style={{
            width: w, height: 28, borderRadius: 6,
            background: "#1a1c2e",
            animation: "dalkak-pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>

      {/* 메인 영역 */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}>
        {/* 왼쪽 사이드바 (Activity Bar + File Tree / AI Panel) */}
        <div style={{
          width: 44,
          background: "#0a0b12",
          borderRight: "1px solid #1a1c2e",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          padding: "12px 0",
          gap: 16,
        }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 24, height: 24, borderRadius: 6,
              background: i === 0 ? "rgba(249,115,22,0.2)" : "#1a1c2e",
              animation: "dalkak-pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>

        {/* 좌측 패널 (AI 채팅 또는 파일 트리) */}
        <div style={{
          width: 265,
          background: "#0d0e17",
          borderRight: "1px solid #1a1c2e",
          display: "flex",
          flexDirection: "column" as const,
          padding: 16,
          gap: 12,
        }}>
          {/* 패널 탭 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            {[50, 50].map((w, i) => (
              <div key={i} style={{
                width: w, height: 24, borderRadius: 5,
                background: i === 0 ? "rgba(249,115,22,0.15)" : "#1a1c2e",
                animation: "dalkak-pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
          {/* AI 메시지 스켈레톤 */}
          {[180, 220, 160, 200, 140].map((w, i) => (
            <div key={i} style={{
              width: w, height: 12, borderRadius: 3,
              background: "#1a1c2e",
              animation: "dalkak-pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }} />
          ))}
          <div style={{ flex: 1 }} />
          {/* 입력란 스켈레톤 */}
          <div style={{
            height: 80, borderRadius: 10,
            background: "#12141e",
            border: "1px solid #1a1c2e",
          }} />
        </div>

        {/* 중앙 에디터 영역 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column" as const,
          background: "#0e1019",
        }}>
          {/* 에디터 탭 바 */}
          <div style={{
            height: 36,
            background: "#0d0e17",
            borderBottom: "1px solid #1a1c2e",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 4,
          }}>
            {["index.html", "style.css", "script.js"].map((name, i) => (
              <div key={name} style={{
                width: 90, height: 26, borderRadius: 5,
                background: i === 0 ? "#0e1019" : "#0a0b12",
                animation: "dalkak-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
          {/* 코드 라인 스켈레톤 */}
          <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {[0.9, 0.7, 0.6, 0.85, 0.5, 0.75, 0.3, 0.65, 0.8, 0.4, 0.7, 0.55].map((ratio, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 30, height: 10, borderRadius: 2,
                  background: "#1a1c2e",
                  opacity: 0.5,
                }} />
                <div style={{
                  width: `${ratio * 60}%`, height: 10, borderRadius: 2,
                  background: "#1a1c2e",
                  animation: "dalkak-pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.08}s`,
                }} />
              </div>
            ))}
          </div>
          {/* 하단 콘솔 스켈레톤 */}
          <div style={{
            height: 130,
            background: "#0a0b12",
            borderTop: "1px solid #1a1c2e",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column" as const,
            gap: 6,
          }}>
            <div style={{
              width: 60, height: 10, borderRadius: 2,
              background: "#1a1c2e",
              marginBottom: 4,
            }} />
            {[0.5, 0.7, 0.4].map((r, i) => (
              <div key={i} style={{
                width: `${r * 50}%`, height: 10, borderRadius: 2,
                background: "#1a1c2e",
                animation: "dalkak-pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        </div>

        {/* 우측 미리보기 패널 */}
        <div style={{
          width: 440,
          background: "#12141e",
          borderLeft: "1px solid #1a1c2e",
          display: "flex",
          flexDirection: "column" as const,
        }}>
          {/* 미리보기 헤더 */}
          <div style={{
            height: 40,
            background: "#0d0e17",
            borderBottom: "1px solid #1a1c2e",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 5,
              background: "#1a1c2e",
            }} />
            <div style={{
              flex: 1, height: 24, borderRadius: 6,
              background: "#0e1019",
              border: "1px solid #1a1c2e",
            }} />
            <div style={{
              width: 28, height: 24, borderRadius: 5,
              background: "#1a1c2e",
            }} />
          </div>
          {/* 미리보기 본문 스켈레톤 */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column" as const,
            gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg, #f97316, #f43f5e)",
              opacity: 0.3,
              animation: "dalkak-pulse 1.5s ease-in-out infinite",
            }} />
            <div style={{
              width: 120, height: 12, borderRadius: 3,
              background: "#1a1c2e",
              animation: "dalkak-pulse 1.5s ease-in-out infinite",
            }} />
          </div>
        </div>
      </div>

      {/* 하단 상태바 스켈레톤 */}
      <div style={{
        height: 24,
        background: "#0a0b12",
        borderTop: "1px solid #1a1c2e",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 16,
      }}>
        {[60, 80, 100].map((w, i) => (
          <div key={i} style={{
            width: w, height: 10, borderRadius: 2,
            background: "#1a1c2e",
            animation: "dalkak-pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes dalkak-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
