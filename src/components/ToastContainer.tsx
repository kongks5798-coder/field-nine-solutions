"use client";
import type { ToastState } from "@/hooks/useToast";

const TYPE_COLORS: Record<ToastState["type"], string> = {
  success: "#22c55e",
  error: "#ef4444",
  info: "#3b82f6",
};

export default function ToastContainer({ toasts }: { toasts: ToastState[] }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 360,
      }}
    >
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          aria-live="polite"
          style={{
            background: "#1e293b",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            borderLeft: `4px solid ${TYPE_COLORS[t.type]}`,
            animation: "toast-slide-in 0.25s ease-out",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
