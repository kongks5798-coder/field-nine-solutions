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

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, color: C.text }}>
        {topBar}

        {/* Mobile panels */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
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

        {/* 에러 바 (모바일) */}
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

        {/* 모바일 탭바: 채팅 | 프리뷰 */}
        <div style={{
          display: "flex",
          height: 52,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {(["ai", "preview"] as MobileTab[]).map(tab => {
            const icons: Record<MobileTab, string> = { ai: "💬", preview: "▶" };
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
                  gap: 2,
                  border: "none",
                  background: "transparent",
                  color: active ? C.accent : C.muted,
                  cursor: "pointer",
                  fontSize: 18,
                  transition: "all 0.15s",
                  borderTop: active ? `2px solid ${C.accent}` : "2px solid transparent",
                }}
              >
                <span style={{ fontSize: 16 }}>{icons[tab]}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{labels[tab]}</span>
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
