"use client";

import { T } from "@/lib/theme";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 32,
  color = T.accent,
  label = "로딩 중...",
}: LoadingSpinnerProps) {
  const borderWidth = Math.max(2, Math.round(size / 10));
  return (
    <div role="status" aria-label={label} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <div data-testid="spinner" style={{ width: size, height: size, borderRadius: "50%" }} />
      <span className="sr-only">{label}</span>
    </div>
  );
}