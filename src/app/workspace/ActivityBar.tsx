"use client";

import React from "react";
import { T } from "./workspace.constants";
import type { LeftTab } from "./workspace.constants";
import {
  useLayoutStore,
  usePreviewStore,
  useUiStore,
} from "./stores";

interface Props {
  router: { push: (url: string) => void };
}

const NAV_ITEMS: { id: LeftTab; icon: string; title: string }[] = [
  { id: "files",  icon: "\u{F0C9B}", title: "파일 탐색기" },
  { id: "search", icon: "\uD83D\uDD0D", title: "파일 검색 (Ctrl+Shift+F)" },
  { id: "ai",     icon: "\u2726",  title: "AI 어시스턴트" },
];

export function ActivityBar({ router }: Props) {
  const leftTab = useLayoutStore(s => s.leftTab);
  const setLeftTab = useLayoutStore(s => s.setLeftTab);
  const bottomTab = useLayoutStore(s => s.bottomTab);
  const setBottomTab = useLayoutStore(s => s.setBottomTab);
  const showConsole = useLayoutStore(s => s.showConsole);
  const setShowConsole = useLayoutStore(s => s.setShowConsole);
  const errorCount = usePreviewStore(s => s.errorCount);
  const setShowCommandPalette = useUiStore(s => s.setShowCommandPalette);

  return (
    <div style={{
      width: 44, flexShrink: 0,
      background: T.topbar,
      borderRight: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column",
      alignItems: "center", paddingTop: 6,
      gap: 2, zIndex: 10, userSelect: "none",
    }}>
      {/* Main nav icons */}
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => setLeftTab(item.id)}
          title={item.title}
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `2px solid ${leftTab === item.id ? "rgba(249,115,22,0.35)" : "transparent"}`,
            background: leftTab === item.id ? "rgba(249,115,22,0.10)" : "transparent",
            color: leftTab === item.id ? T.accent : T.muted,
            cursor: "pointer", fontSize: item.id === "ai" ? 16 : 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", transition: "all 0.12s",
            boxShadow: leftTab === item.id ? `0 0 0 1px rgba(249,115,22,0.12)` : "none",
          }}
          onMouseEnter={e => {
            if (leftTab !== item.id) {
              e.currentTarget.style.color = T.text;
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }
          }}
          onMouseLeave={e => {
            if (leftTab !== item.id) {
              e.currentTarget.style.color = T.muted;
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          {item.id === "files" ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h4.086a1.5 1.5 0 0 1 1.06.44l.915.914A1.5 1.5 0 0 0 10.62 3.5H12.5A1.5 1.5 0 0 1 14 5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V3.5Z"/>
            </svg>
          ) : item.id === "search" ? (
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="4.5"/>
              <path d="M11 11L14 14"/>
            </svg>
          ) : (
            <span style={{ fontWeight: 700 }}>{"\u2726"}</span>
          )}
          {/* Error badge on AI icon */}
          {item.id === "ai" && errorCount > 0 && (
            <span style={{
              position: "absolute", top: 3, right: 3,
              width: 7, height: 7, borderRadius: "50%",
              background: T.red, border: `1.5px solid ${T.topbar}`,
            }} />
          )}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: 22, height: 1, background: T.border, margin: "6px 0" }} />

      {/* Terminal toggle */}
      <button
        onClick={() => {
          if (bottomTab === "terminal" && showConsole) {
            setShowConsole(false);
          } else {
            setBottomTab("terminal");
            setShowConsole(true);
          }
        }}
        title="터미널 (Ctrl+`)"
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: `2px solid ${bottomTab === "terminal" && showConsole ? "rgba(249,115,22,0.35)" : "transparent"}`,
          background: bottomTab === "terminal" && showConsole ? "rgba(249,115,22,0.10)" : "transparent",
          color: bottomTab === "terminal" && showConsole ? T.accent : T.muted,
          cursor: "pointer", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.12s",
          boxShadow: bottomTab === "terminal" && showConsole ? "0 0 0 1px rgba(249,115,22,0.12)" : "none",
          fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
          fontWeight: 700,
        }}
        onMouseEnter={e => {
          if (!(bottomTab === "terminal" && showConsole)) {
            e.currentTarget.style.color = T.text;
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }
        }}
        onMouseLeave={e => {
          if (!(bottomTab === "terminal" && showConsole)) {
            e.currentTarget.style.color = T.muted;
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12l4-4-4-4"/><path d="M8 12h4"/>
        </svg>
      </button>

      {/* Command Palette */}
      <button
        onClick={() => setShowCommandPalette(true)}
        title="명령어 팔레트 (Ctrl+K)"
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid transparent",
          background: "transparent", color: T.muted,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.12s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = T.text;
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = T.muted;
          e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6.5" cy="6.5" r="4.5"/>
          <path d="M10.5 10.5L14 14"/>
        </svg>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings */}
      <button
        onClick={() => router.push("/settings")}
        title="설정"
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: "1px solid transparent",
          background: "transparent", color: T.muted,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 8, transition: "all 0.12s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = T.text;
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = T.muted;
          e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2"/>
          <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.76 3.76l.71.71M11.53 11.53l.71.71M3.76 12.24l.71-.71M11.53 4.47l.71-.71"/>
        </svg>
      </button>
    </div>
  );
}
