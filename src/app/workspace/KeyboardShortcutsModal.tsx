"use client";

import React from "react";
import { T } from "./workspace.constants";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: "Ctrl + Enter", desc: "프로젝트 실행" },
  { keys: "Ctrl + S", desc: "파일 저장" },
  { keys: "Ctrl + Shift + P", desc: "명령 팔레트" },
  { keys: "Ctrl + /", desc: "단축키 도움말" },
  { keys: "Ctrl + B", desc: "사이드바 토글" },
  { keys: "Ctrl + J", desc: "AI 채팅 포커스" },
  { keys: "Escape", desc: "모달/패널 닫기" },
];

export function KeyboardShortcutsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: "24px 28px", width: 400, maxWidth: "90vw",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 id="shortcuts-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>
            단축키
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: T.muted, fontSize: 18,
              cursor: "pointer", padding: "2px 6px", lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SHORTCUTS.map((s) => (
            <div key={s.keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <span style={{ fontSize: 13, color: T.muted }}>{s.desc}</span>
              <kbd style={{
                background: "#f3f4f6", border: `1px solid ${T.border}`,
                borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                color: T.text, fontFamily: "monospace", whiteSpace: "nowrap",
              }}>
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
