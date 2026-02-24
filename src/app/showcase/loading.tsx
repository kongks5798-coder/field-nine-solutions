export default function ShowcaseLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 20px 80px" }}>
      {/* Hero skeleton */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            width: 280,
            height: 36,
            borderRadius: 8,
            background: "#e5e7eb",
            margin: "0 auto 12px",
            animation: "shimmer 1.5s infinite",
          }}
        />
        <div
          style={{
            width: 200,
            height: 20,
            borderRadius: 6,
            background: "#e5e7eb",
            margin: "0 auto",
            animation: "shimmer 1.5s infinite",
            animationDelay: "0.15s",
          }}
        />
      </div>

      {/* Filter skeleton */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 36,
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 72,
              height: 34,
              borderRadius: 20,
              background: "#e5e7eb",
              animation: "shimmer 1.5s infinite",
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Thumbnail skeleton */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16/10",
                background: "#f3f4f6",
                borderRadius: 10,
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.08}s`,
              }}
            />
            {/* Tag skeleton */}
            <div
              style={{
                width: 52,
                height: 20,
                borderRadius: 20,
                background: "#e5e7eb",
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
            {/* Name skeleton */}
            <div
              style={{
                width: "75%",
                height: 18,
                borderRadius: 6,
                background: "#e5e7eb",
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
            {/* Author skeleton */}
            <div
              style={{
                width: "50%",
                height: 14,
                borderRadius: 6,
                background: "#f3f4f6",
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.14}s`,
              }}
            />
            {/* Button skeleton */}
            <div
              style={{
                width: "100%",
                height: 36,
                borderRadius: 8,
                background: "#f3f4f6",
                marginTop: "auto",
                animation: "shimmer 1.5s infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.4; }
          100% { opacity: 1; }
        }
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
