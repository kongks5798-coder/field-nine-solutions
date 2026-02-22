"use client";

import React from "react";
import { T } from "./workspace.constants";
import type { LeftTab } from "./workspace.constants";

interface Props {
  leftTab: LeftTab;
  setLeftTab: React.Dispatch<React.SetStateAction<LeftTab>>;
  errorCount: number;
  router: { push: (url: string) => void };
  setShowCommandPalette: React.Dispatch<React.SetStateAction<boolean>>;
}

const NAV_ITEMS: { id: LeftTab; icon: string; title: string }[] = [
  { id: "files", icon: "󰉋", title: "파일 탐색기" },
  { id: "ai",    icon: "✦",  title: "AI 어시스턴트" },
];

export function ActivityBar({ leftTab, setLeftTab, errorCount, router, setShowCommandPalette }: Props) {
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
          ) : (
            <span style={{ fontWeight: 700 }}>✦</span>
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
