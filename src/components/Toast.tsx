"use client";

import { useEffect, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number; // ms, 0이면 자동 닫기 없음
}

const COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e" },
  error:   { bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)", color: "#f87171" },
  info:    { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)",  color: "#60a5fa" },
  warning: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
};

const ICONS: Record<ToastType, string> = {
  success: "✅", error: "❌", info: "ℹ️", warning: "⚠️",
};

export function Toast({ message, type = "info", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const c = COLORS[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 99999,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 10, maxWidth: 400,
        background: c.bg, border: `1px solid ${c.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "slideUp 0.2s ease",
        fontFamily: '"Pretendard", Inter, sans-serif',
      }}
    >
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <span style={{ fontSize: 16 }}>{ICONS[type]}</span>
      <span style={{ fontSize: 13, color: c.color, flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="알림 닫기"
        style={{ background: "none", border: "none", color: c.color, cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.7 }}
      >
        ✕
      </button>
    </div>
  );
}

// 사용 편의 훅
interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const toastElement = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, hideToast, toastElement };
}
