export default function BlogLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
      {/* Hero skeleton */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            width: 220,
            height: 36,
            borderRadius: 8,
            background: "#e5e7eb",
            margin: "0 auto 12px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            width: 180,
            height: 20,
            borderRadius: 6,
            background: "#e5e7eb",
            margin: "0 auto",
            animation: "shimmer 1.5s infinite",
            animationDelay: "0.15s",
          }}
        />
      </div>

      {/* Content skeleton: sidebar + grid */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32 }}>
        {/* Sidebar skeleton */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #e5e7eb",
            height: 220,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: "80%",
                height: 16,
                borderRadius: 6,
                background: "#e5e7eb",
                marginBottom: 12,
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Post grid skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#e5e7eb",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
                <div
                  style={{
                    width: 60,
                    height: 20,
                    borderRadius: 20,
                    background: "#e5e7eb",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              </div>
              <div
                style={{
                  width: "90%",
                  height: 20,
                  borderRadius: 6,
                  background: "#e5e7eb",
                  animation: "shimmer 1.5s infinite",
                  animationDelay: `${i * 0.12}s`,
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 14,
                  borderRadius: 6,
                  background: "#f3f4f6",
                  animation: "shimmer 1.5s infinite",
                  animationDelay: `${i * 0.14}s`,
                }}
              />
              <div
                style={{
                  width: "70%",
                  height: 14,
                  borderRadius: 6,
                  background: "#f3f4f6",
                  animation: "shimmer 1.5s infinite",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 200px 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
