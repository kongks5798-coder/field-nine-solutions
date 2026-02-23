"use client";

import React from "react";
import { T } from "./workspace.constants";
import type { PreviewWidth } from "./workspace.constants";

export interface PreviewHeaderToolbarProps {
  previewWidth: PreviewWidth;
  previewRefreshing: boolean;
  hasRun: boolean;
  projectName: string;
  autoTesting: boolean;
  isFullPreview: boolean;
  setPreviewWidth: React.Dispatch<React.SetStateAction<PreviewWidth>>;
  setIsFullPreview: React.Dispatch<React.SetStateAction<boolean>>;
  runProject: () => void;
  autoTest: () => void;
  isMobile?: boolean;
}

export function PreviewHeaderToolbar({
  previewWidth, previewRefreshing, hasRun, projectName, autoTesting, isFullPreview,
  setPreviewWidth, setIsFullPreview, runProject, autoTest, isMobile,
}: PreviewHeaderToolbarProps) {
  const iconBtnSize = isMobile ? 36 : 24;
  return (
    <div style={{ display: "flex", alignItems: "center", height: isMobile ? 44 : 36, background: T.topbar, borderBottom: `1px solid ${T.border}`, padding: "0 8px", gap: 5, flexShrink: 0 }}>
      {/* macOS dots — hidden on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f85149", cursor: "pointer" }} onClick={() => setIsFullPreview(false)}/>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f0883e" }}/>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#3fb950", cursor: "pointer" }} onClick={runProject}/>
        </div>
      )}

      <button onClick={runProject}
        style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: isMobile ? 20 : 14, padding: isMobile ? "6px 8px" : "2px 4px", lineHeight: 1, minHeight: isMobile ? 36 : undefined }}>⟳</button>

      {/* URL bar */}
      <div style={{
        flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6,
        padding: "3px 8px", fontSize: 10, color: T.muted,
        border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 5,
        overflow: "hidden",
      }}>
        {previewRefreshing && (
          <div style={{ width: 8, height: 8, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: T.accent, borderRadius: "50%", flexShrink: 0, animation: "spin 0.8s linear infinite" }}/>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {hasRun ? `미리보기 › ${projectName}` : "dalkak.io"}
        </span>
      </div>

      {/* Responsive toggles — hidden on mobile */}
      {!isMobile && ([
        ["full", "🖥", "전체"],
        ["1280", "💻", "1280"],
        ["768", "📱", "768"],
        ["375", "📱", "375"],
      ] as [PreviewWidth, string, string][]).map(([w, icon, label]) => (
        <button key={w} onClick={() => setPreviewWidth(w)} title={`${label}px`}
          style={{
            width: 24, height: 24, borderRadius: 5, border: `1px solid ${T.border}`,
            background: previewWidth === w ? `${T.accent}20` : "rgba(255,255,255,0.03)",
            color: previewWidth === w ? T.accent : T.muted,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "inherit",
          }}>{icon}</button>
      ))}

      {/* Auto Test */}
      <button onClick={autoTesting ? undefined : autoTest} title="자동 테스트 — 앱 요소를 자동 클릭"
        style={{
          width: iconBtnSize, height: iconBtnSize, borderRadius: isMobile ? 8 : 5,
          border: `1px solid ${autoTesting ? T.borderHi : T.border}`,
          background: autoTesting ? `${T.accent}20` : "rgba(255,255,255,0.03)",
          color: autoTesting ? T.accent : T.muted,
          cursor: autoTesting ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {autoTesting
          ? <div style={{ width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.3)", borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          : <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 0l8 5-8 5z"/></svg>
        }
      </button>

      {/* Fullscreen */}
      <button onClick={() => setIsFullPreview(f => !f)}
        style={{ width: iconBtnSize, height: iconBtnSize, borderRadius: isMobile ? 8 : 5, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isFullPreview
          ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3.5h2.5V1M8 3.5H5.5V1M1 5.5h2.5V8M8 5.5H5.5V8"/></svg>
          : <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3V1h2.5M5.5 1H8v2.5M8 6v2H5.5M3.5 8H1V6"/></svg>
        }
      </button>
    </div>
  );
}
