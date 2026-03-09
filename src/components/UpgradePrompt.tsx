"use client";

import { useRouter } from "next/navigation";

interface UpgradePromptProps {
  reason?: string;
  onClose?: () => void;
  variant?: "banner" | "modal";
}

/**
 * UpgradePrompt — shown when a user hits the free tier limit.
 * variant="banner": inline top-of-page banner (default)
 * variant="modal":  centered overlay modal
 */
export default function UpgradePrompt({
  reason = "AI 생성 한도를 초과했습니다",
  onClose,
  variant = "banner",
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/pricing");
    onClose?.();
  };

  if (variant === "modal") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="플랜 업그레이드 안내"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: "#0f0f1a",
            border: "1px solid rgba(249,115,22,0.35)",
            borderRadius: 20,
            padding: "36px 32px",
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 0 80px rgba(249,115,22,0.15)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{
            fontSize: 20, fontWeight: 900, color: "#e2e8f0",
            marginBottom: 10, letterSpacing: "-0.02em",
          }}>
            한도 초과
          </h2>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7, marginBottom: 24,
          }}>
            {reason}<br />
            <strong style={{ color: "#f97316" }}>Pro</strong>로 업그레이드하면 AI 생성이 무제한!
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="닫기"
                style={{
                  padding: "11px 20px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                나중에
              </button>
            )}
            <button
              onClick={handleUpgrade}
              aria-label="Pro 플랜으로 업그레이드"
              style={{
                padding: "11px 24px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #f97316, #f43f5e)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(249,115,22,0.35)",
              }}
            >
              Pro 업그레이드 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: banner
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "12px 20px",
        background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(244,63,94,0.08))",
        border: "1px solid rgba(249,115,22,0.35)",
        borderRadius: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500, lineHeight: 1.5 }}>
          <strong style={{ color: "#f97316" }}>한도 초과:</strong>{" "}
          {reason} —{" "}
          <strong style={{ color: "#f97316" }}>Pro</strong>로 업그레이드하면 무제한!
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={handleUpgrade}
          aria-label="요금제 페이지로 이동하여 업그레이드"
          style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #f97316, #f43f5e)",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          업그레이드 →
        </button>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="배너 닫기"
            style={{
              padding: "7px 10px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: 16, cursor: "pointer", lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
