"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/theme";

const STORAGE_KEY = "f9_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        // Small delay so banner appears after page paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="쿠키 동의"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px 16px",
        pointerEvents: "none",
        animation: "f9-cookie-in 0.4s ease-out forwards",
      }}
    >
      <div style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        maxWidth: 720,
        width: "100%",
        padding: "14px 20px",
        background: "rgba(13,16,32,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <p style={{
          flex: 1,
          fontSize: 14,
          color: T.text,
          lineHeight: 1.5,
          margin: 0,
          minWidth: 200,
        }}>
          Dalkak은 서비스 개선을 위해 쿠키를 사용합니다.
        </p>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <a
            href="/privacy"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: T.muted,
              textDecoration: "none",
              border: `1px solid ${T.border}`,
              background: "transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            자세히
          </a>
          <button
            onClick={handleAccept}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: T.accent,
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
          >
            동의
          </button>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes f9-cookie-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
