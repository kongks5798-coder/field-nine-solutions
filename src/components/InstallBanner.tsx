"use client";

import { useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: 16, left: 16, right: 16,
      zIndex: 9998, display: "flex", justifyContent: "center",
      pointerEvents: "none",
    }}>
      <div style={{
        pointerEvents: "auto",
        display: "flex", alignItems: "center", gap: 12,
        maxWidth: 420, width: "100%",
        padding: "12px 16px",
        background: "rgba(13,16,32,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        animation: "f9-install-in 0.4s ease-out forwards",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #f97316, #f43f5e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 16, color: "#fff",
        }}>D</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>
            Dalkak 설치
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            홈 화면에 추가하여 빠르게 접근
          </div>
        </div>

        <button
          onClick={async () => {
            await promptInstall();
            setDismissed(true);
          }}
          style={{
            padding: "8px 16px", borderRadius: 8,
            background: "#f97316", border: "none",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          설치
        </button>

        <button
          onClick={() => setDismissed(true)}
          aria-label="닫기"
          style={{
            background: "none", border: "none",
            color: "#6b7280", fontSize: 18, cursor: "pointer",
            padding: 4, flexShrink: 0, lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      <style>{`
        @keyframes f9-install-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
