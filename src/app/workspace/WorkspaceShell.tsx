"use client";

import React, { useState } from "react";
import { useLayoutStore } from "./stores";

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(255,255,255,0.08)",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#f97316",
} as const;

interface WorkspaceShellProps {
  leftPanel: React.ReactNode;       // 채팅
  rightPreview: React.ReactNode;    // 프리뷰
  rightCode: React.ReactNode;       // 코드에디터
  topBar: React.ReactNode;
  modals?: React.ReactNode;
  activeTab: "preview" | "code";    // 현재 활성 탭
  errorCount?: number;              // 에러 수 (에러바 표시용)
  onAutoFix?: () => void;           // AI 자동수정 콜백
}

export function WorkspaceShell({
  leftPanel,
  rightPreview,
  rightCode,
  topBar,
  modals,
  activeTab,
  errorCount,
  onAutoFix,
}: WorkspaceShellProps) {
  const isMobile = useLayoutStore(s => s.isMobile);
  const setMobilePanel = useLayoutStore(s => s.setMobilePanel);

  // 모바일: "ai" | "preview" 2탭
  type MobileTab = "ai" | "preview";
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");

  const handleMobileTab = (tab: MobileTab) => {
    setMobileTab(tab);
    setMobilePanel(tab);
  };

  // Mobile tab bar height constant
  const TAB_BAR_H = 56;

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#faf8f5", color: "#0a0a0a", position: "relative" }}>
        {/* Top bar (flexShrink: 0, measured implicitly) */}
        <div style={{ flexShrink: 0 }}>
          {topBar}
        </div>

        {/* Mobile panels — fill remaining space above tab bar */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", paddingBottom: TAB_BAR_H }}>
          <div style={{
            display: mobileTab === "ai" ? "flex" : "none",
            flexDirection: "column", height: "100%", overflow: "hidden",
          }}>
            {leftPanel}
          </div>
          <div style={{
            display: mobileTab === "preview" ? "flex" : "none",
            flexDirection: "column", height: "100%", overflow: "hidden",
          }}>
            {activeTab === "preview" ? rightPreview : rightCode}
          </div>
        </div>

        {/* 에러 바 (모바일) — above tab bar */}
        {(errorCount ?? 0) > 0 && (
          <div style={{
            position: "fixed", bottom: TAB_BAR_H, left: 0, right: 0, zIndex: 40,
            height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 16px", background: "rgba(239,68,68,0.08)",
            borderTop: "1px solid rgba(239,68,68,0.2)",
          }}>
            <span style={{ fontSize: 12, color: "#ef4444" }}>
              &#9888; JS 에러 {errorCount}개
            </span>
            <button onClick={onAutoFix} style={{
              fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "none",
              background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontWeight: 600,
            }}>
              AI 자동수정
            </button>
          </div>
        )}

        {/* 모바일 탭바: 채팅 | 프리뷰 — fixed bottom */}
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          display: "flex",
          height: TAB_BAR_H,
          background: "#ffffff",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          zIndex: 50,
        }}>
          {(["ai", "preview"] as MobileTab[]).map(tab => {
            const labels: Record<MobileTab, string> = { ai: "채팅", preview: "프리뷰" };
            const active = mobileTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleMobileTab(tab)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Active: black pill wrapping icon; inactive: plain muted icon */}
                <div style={{
                  width: 44,
                  height: 28,
                  borderRadius: 14,
                  background: active ? "#0a0a0a" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.18s",
                }}>
                  {tab === "ai" ? (
                    /* Chat bubble icon */
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                      stroke={active ? "#ffffff" : "rgba(0,0,0,0.4)"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  ) : (
                    /* Play icon */
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                      stroke={active ? "#ffffff" : "rgba(0,0,0,0.4)"}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: active ? "#0a0a0a" : "rgba(0,0,0,0.4)",
                  lineHeight: 1,
                  transition: "color 0.18s",
                }}>{labels[tab]}</span>
              </button>
            );
          })}
        </div>

        {modals}
      </div>
    );
  }

  // 데스크탑 2패널 레이아웃
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: C.bg,
      color: C.text,
      overflow: "hidden",
    }}>
      {/* Top bar */}
      <div style={{ flexShrink: 0 }}>
        {topBar}
      </div>

      {/* 2패널 body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* 좌: 채팅 (고정 320px) */}
        <div style={{
          width: 320,
          flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {leftPanel}
        </div>

        {/* 우: 탭 패널 (flex 1) */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "preview" ? rightPreview : rightCode}
        </div>
      </div>

      {/* 에러 바 (하단, 조건부) */}
      {(errorCount ?? 0) > 0 && (
        <div style={{
          height: 36, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", background: "rgba(239,68,68,0.08)",
          borderTop: "1px solid rgba(239,68,68,0.2)", flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "#ef4444" }}>
            &#9888; JS 에러 {errorCount}개
          </span>
          <button onClick={onAutoFix} style={{
            fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "none",
            background: "rgba(249,115,22,0.15)", color: "#f97316", cursor: "pointer", fontWeight: 600,
          }}>
            AI 자동수정
          </button>
        </div>
      )}

      {modals}
    </div>
  );
}
