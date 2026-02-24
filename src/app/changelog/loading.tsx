export default function ChangelogLoading() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 20px 80px" }}>
      {/* Hero skeleton */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div
          style={{
            width: 180,
            height: 36,
            borderRadius: 8,
            background: "#e5e7eb",
            margin: "0 auto 12px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            width: 260,
            height: 20,
            borderRadius: 6,
            background: "#e5e7eb",
            margin: "0 auto",
            animation: "shimmer 1.5s infinite",
            animationDelay: "0.15s",
          }}
        />
      </div>

      {/* Timeline skeleton */}
      <div style={{ position: "relative", paddingLeft: 36 }}>
        {/* Vertical line */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 11,
            top: 8,
            bottom: 8,
            width: 2,
            background: "#e5e7eb",
            borderRadius: 1,
          }}
        />

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              position: "relative",
              marginBottom: i < 5 ? 40 : 0,
            }}
          >
            {/* Dot skeleton */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: -30,
                top: 6,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#e5e7eb",
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />

            {/* Card skeleton */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 24,
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 26,
                    borderRadius: 20,
                    background: "#e5e7eb",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
                <div
                  style={{
                    width: 48,
                    height: 22,
                    borderRadius: 20,
                    background: "#e5e7eb",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
                <div
                  style={{
                    width: 90,
                    height: 16,
                    borderRadius: 6,
                    background: "#f3f4f6",
                    marginLeft: "auto",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              </div>

              {/* Title skeleton */}
              <div
                style={{
                  width: "60%",
                  height: 22,
                  borderRadius: 6,
                  background: "#e5e7eb",
                  marginBottom: 16,
                  animation: "shimmer 1.5s infinite",
                  animationDelay: `${i * 0.14}s`,
                }}
              />

              {/* Bullet skeletons */}
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  style={{
                    width: `${90 - j * 10}%`,
                    height: 14,
                    borderRadius: 6,
                    background: "#f3f4f6",
                    marginBottom: 8,
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${i * 0.12 + j * 0.06}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
