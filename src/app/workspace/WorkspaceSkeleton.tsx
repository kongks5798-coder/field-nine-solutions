"use client";

// WorkspaceSkeleton — shown while WorkspaceIDE hydrates / Monaco lazy-loads.
// Mimics the 2-panel desktop layout (TopBar 52px + left 320px chat + right preview).
// Uses a warm ivory shimmer that matches the workspace's ivory light theme.

export function WorkspaceSkeleton() {
  const shimmerBar = (w: string | number, h: number, radius = 6) =>
    ({
      width: w,
      height: h,
      borderRadius: radius,
      background: "linear-gradient(90deg, #ede9e4 25%, #e5e0d9 50%, #ede9e4 75%)",
      backgroundSize: "200% 100%",
      animation: "ws-shimmer 1.5s ease-in-out infinite",
      flexShrink: 0,
    } as React.CSSProperties);

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#faf8f5",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ws-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {/* ── TopBar skeleton (52px) ─────────────────────────────────────────── */}
      <div
        style={{
          height: 52,
          flexShrink: 0,
          background: "#faf8f5",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        {/* Logo pill */}
        <div style={shimmerBar(28, 28, 7)} />
        {/* Separator */}
        <div style={{ width: 4, flexShrink: 0 }} />
        {/* Project name */}
        <div style={shimmerBar(140, 16, 5)} />
        <div style={{ flex: 1 }} />
        {/* Center tabs */}
        <div style={shimmerBar(64, 30, 7)} />
        <div style={shimmerBar(64, 30, 7)} />
        <div style={{ flex: 1 }} />
        {/* Right actions */}
        <div style={shimmerBar(24, 24, 12)} />
        <div style={shimmerBar(44, 44, 22)} />
        <div style={shimmerBar(72, 34, 8)} />
      </div>

      {/* ── Body: left chat + right preview ──────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left panel — 320px chat skeleton */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderRight: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
            padding: "20px 16px",
            gap: 16,
            background: "#faf8f5",
          }}
        >
          {/* Input area at top */}
          <div
            style={{
              height: 48,
              borderRadius: 10,
              background: "linear-gradient(90deg, #ede9e4 25%, #e5e0d9 50%, #ede9e4 75%)",
              backgroundSize: "200% 100%",
              animation: "ws-shimmer 1.5s ease-in-out infinite",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          />

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(0,0,0,0.05)" }} />

          {/* Message bubbles */}
          {[80, 120, 64].map((h, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Avatar + name row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={shimmerBar(24, 24, 12)} />
                <div style={shimmerBar(60, 12, 4)} />
              </div>
              {/* Message block */}
              <div
                style={{
                  height: h,
                  borderRadius: 10,
                  marginLeft: 32,
                  background: "linear-gradient(90deg, #ede9e4 25%, #e5e0d9 50%, #ede9e4 75%)",
                  backgroundSize: "200% 100%",
                  animation: `ws-shimmer 1.5s ${i * 0.15}s ease-in-out infinite`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Right panel — preview skeleton */}
        <div
          style={{
            flex: 1,
            background: "#f4f2ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Large shimmer fill */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, #f4f2ef 25%, #ede9e4 50%, #f4f2ef 75%)",
              backgroundSize: "200% 100%",
              animation: "ws-shimmer 2s ease-in-out infinite",
            }}
          />

          {/* Centered spinner */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "2.5px solid rgba(0,0,0,0.10)",
                borderTopColor: "rgba(0,0,0,0.35)",
                borderRadius: "50%",
                animation: "ws-spin 0.8s linear infinite",
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "rgba(0,0,0,0.35)",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
              }}
            >
              로딩 중...
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ws-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
