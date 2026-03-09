"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useLayoutStore } from "./stores";

// ── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117",
  surface: "#161b22",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#f97316",
  accentBg: "rgba(249,115,22,0.1)",
} as const;

interface WorkspaceShellProps {
  leftPanel: React.ReactNode;      // AiChatPanel
  centerPanel: React.ReactNode;    // Editor (file tree + code)
  rightPanel: React.ReactNode;     // Preview (iframe + console)
  topBar: React.ReactNode;         // WorkspaceTopBar
  modals: React.ReactNode;         // All modal portals
}

export function WorkspaceShell({
  leftPanel,
  centerPanel,
  rightPanel,
  topBar,
  modals,
}: WorkspaceShellProps) {
  const isMobile = useLayoutStore(s => s.isMobile);
  const mobilePanel = useLayoutStore(s => s.mobilePanel);
  const setMobilePanel = useLayoutStore(s => s.setMobilePanel);
  const leftW = useLayoutStore(s => s.leftW);
  const setLeftW = useLayoutStore(s => s.setLeftW);
  const rightW = useLayoutStore(s => s.rightW);
  const setRightW = useLayoutStore(s => s.setRightW);

  // Panel resize state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Left drag handle
  const onLeftDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, []);

  // Right drag handle
  const onRightDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (isDraggingLeft) {
        const newW = Math.max(200, Math.min(500, e.clientX - rect.left));
        setLeftW(newW);
      }
      if (isDraggingRight) {
        const fromRight = rect.right - e.clientX;
        const newW = Math.max(280, Math.min(700, fromRight));
        setRightW(newW);
      }
    };
    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight, setLeftW, setRightW]);

  // Mobile layout
  // Note: mobilePanel store type is "ai" | "preview".
  // We treat "ai" as the left (chat) panel, "preview" as the right panel.
  // The center (editor) panel is shown when neither ai nor preview is active
  // by extending the store panel to include "editor" locally via a cast.
  type MobilePanelExtended = "ai" | "preview" | "editor";
  const [localMobilePanel, setLocalMobilePanel] = useState<MobilePanelExtended>(mobilePanel);

  const handleMobilePanelChange = useCallback((panel: MobilePanelExtended) => {
    setLocalMobilePanel(panel);
    // Sync to store for panels it knows about
    if (panel === "ai" || panel === "preview") {
      setMobilePanel(panel);
    }
  }, [setMobilePanel]);

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, color: C.text }}>
        {topBar}
        {/* Mobile panels */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{
            display: localMobilePanel === "ai" ? "flex" : "none",
            flexDirection: "column", height: "100%", overflow: "hidden",
          }}>
            {leftPanel}
          </div>
          <div style={{
            display: localMobilePanel === "editor" ? "block" : "none",
            height: "100%", overflow: "hidden",
          }}>
            {centerPanel}
          </div>
          <div style={{
            display: localMobilePanel === "preview" ? "block" : "none",
            height: "100%", overflow: "hidden",
          }}>
            {rightPanel}
          </div>
        </div>
        {/* Mobile tab bar */}
        <div style={{
          display: "flex",
          height: 52,
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {(["ai", "editor", "preview"] as MobilePanelExtended[]).map(panel => {
            const icons: Record<MobilePanelExtended, string> = { ai: "💬", editor: "{ }", preview: "▶" };
            const labels: Record<MobilePanelExtended, string> = { ai: "채팅", editor: "코드", preview: "프리뷰" };
            const active = localMobilePanel === panel;
            return (
              <button
                key={panel}
                onClick={() => handleMobilePanelChange(panel)}
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
                <span style={{ fontSize: 16 }}>{icons[panel]}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{labels[panel]}</span>
              </button>
            );
          })}
        </div>
        {modals}
      </div>
    );
  }

  // Desktop 3-panel layout
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: C.bg,
        color: C.text,
        overflow: "hidden",
      }}
      ref={containerRef}
    >
      {/* Top bar */}
      <div style={{ flexShrink: 0 }}>
        {topBar}
      </div>

      {/* 3-panel body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Left panel (chat / AI) */}
        <div style={{
          width: leftW,
          minWidth: 200,
          maxWidth: 500,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: `1px solid ${C.border}`,
        }}>
          {leftPanel}
        </div>

        {/* Left resize handle */}
        <div
          onMouseDown={onLeftDragStart}
          style={{
            width: 4,
            cursor: "col-resize",
            background: isDraggingLeft ? C.accent : "transparent",
            transition: "background 0.15s",
            flexShrink: 0,
            zIndex: 10,
            marginLeft: -2,
            marginRight: -2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.borderHover; }}
          onMouseLeave={e => { if (!isDraggingLeft) e.currentTarget.style.background = "transparent"; }}
        />

        {/* Center panel (editor) */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {centerPanel}
        </div>

        {/* Right resize handle */}
        <div
          onMouseDown={onRightDragStart}
          style={{
            width: 4,
            cursor: "col-resize",
            background: isDraggingRight ? C.accent : "transparent",
            transition: "background 0.15s",
            flexShrink: 0,
            zIndex: 10,
            marginLeft: -2,
            marginRight: -2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.borderHover; }}
          onMouseLeave={e => { if (!isDraggingRight) e.currentTarget.style.background = "transparent"; }}
        />

        {/* Right panel (preview) */}
        <div style={{
          width: rightW,
          minWidth: 280,
          maxWidth: 700,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderLeft: `1px solid ${C.border}`,
        }}>
          {rightPanel}
        </div>
      </div>

      {modals}
    </div>
  );
}
