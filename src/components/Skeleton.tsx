"use client";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }}
    />
  );
}

// 카드 스켈레톤
export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
      <Skeleton height={14} width="80%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="40%" />
    </div>
  );
}

// 텍스트 라인 스켈레톤
export function SkeletonText({ lines = 3, style }: { lines?: number; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? "60%" : "100%"} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}
