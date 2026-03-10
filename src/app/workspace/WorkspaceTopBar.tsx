"use client";

import React, { useState } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Project } from "./workspace.constants";
import {
  useUiStore,
  useProjectStore,
  useAiStore,
} from "./stores";

// ── Design tokens (ivory light) ───────────────────────────────────────────────
const C = {
  bg:       "#faf8f5",
  surface:  "#faf8f5",
  surfaceHi:"#f0ede8",
  border:   "rgba(0,0,0,0.08)",
  borderHi: "rgba(0,0,0,0.4)",
  text:     "#0a0a0a",
  muted:    "rgba(0,0,0,0.45)",
  accent:   "#0a0a0a",
  accentDim:"rgba(0,0,0,0.06)",
  green:    "rgba(0,0,0,0.45)",
  red:      "#ef4444",
} as const;

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = C.muted }: { color?: string }) {
  return (
    <div style={{
      width: 10, height: 10, flexShrink: 0,
      border: `1.5px solid ${color}44`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
interface TabBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}
function TabBtn({ children, active, style, ...rest }: TabBtnProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...rest}
      onMouseEnter={e => { setHover(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={e => { setHover(false); rest.onMouseLeave?.(e); }}
      style={{
        height: 32, padding: "0 14px",
        borderRadius: 7,
        border: active
          ? "1px solid rgba(0,0,0,0.4)"
          : hover
            ? "1px solid rgba(0,0,0,0.18)"
            : "1px solid rgba(0,0,0,0.1)",
        background: active
          ? "rgba(0,0,0,0.07)"
          : hover
            ? "rgba(0,0,0,0.04)"
            : "transparent",
        color: active ? C.text : hover ? C.text : C.muted,
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: active ? 600 : 500,
        fontFamily: "inherit",
        flexShrink: 0,
        transition: "border-color 0.12s, background 0.12s, color 0.12s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Version History Clock Button ──────────────────────────────────────────────
function VersionClockBtn({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      title="버전 히스토리"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: hover ? "rgba(0,0,0,0.06)" : "transparent",
        border: "none", cursor: "pointer",
        transition: "background 0.12s",
      }}
    >
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none"
        stroke={hover ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.25)"}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "stroke 0.12s" }}
      >
        <circle cx="7" cy="7" r="6"/>
        <path d="M7 4v3l2 2"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceTopBarProps {
  router: AppRouterInstance;
  nameRef: React.RefObject<HTMLInputElement | null>;
  runProject: () => void;
  publishProject: () => void;
  shareProject?: () => void;
  loadProject: (p: Project) => void;
  activeTab?: "preview" | "code";
  onTabChange?: (tab: "preview" | "code") => void;
  onVersionHistory?: () => void;
}

function WorkspaceTopBarInner({
  router, nameRef,
  publishProject,
  activeTab = "preview",
  onTabChange,
  onVersionHistory,
}: WorkspaceTopBarProps) {
  // UI store
  const editingName = useUiStore(s => s.editingName);
  const setEditingName = useUiStore(s => s.setEditingName);
  const saving = useUiStore(s => s.saving);
  const publishing = useUiStore(s => s.publishing);

  // Project store
  const projectName = useProjectStore(s => s.projectName);
  const setProjectName = useProjectStore(s => s.setProjectName);

  // AI store
  const aiLoading = useAiStore(s => s.aiLoading);

  return (
    <div style={{
      height: 52,
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: "0 16px",
      gap: 8,
      zIndex: 30,
    }}>

      {/* ── LEFT: Logo + Project name ──────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>

        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          title="홈으로"
          style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0, cursor: "pointer",
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "none",
            boxShadow: "0 0 12px rgba(249,115,22,0.25)",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(249,115,22,0.45)"; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 12px rgba(249,115,22,0.25)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 7L7 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 7H13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Separator dot */}
        <span style={{ color: "rgba(0,0,0,0.2)", fontSize: 16, flexShrink: 0, userSelect: "none" }}>·</span>

        {/* Project name (inline editable) */}
        {editingName ? (
          <input
            ref={nameRef as React.RefObject<HTMLInputElement>}
            value={projectName}
            onChange={e => { if (e.target.value.length <= 50) setProjectName(e.target.value); }}
            onBlur={() => {
              if (!projectName.trim()) setProjectName("내 프로젝트");
              setEditingName(false);
            }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
            style={{
              fontSize: 14, fontWeight: 600, color: C.text,
              background: C.surfaceHi,
              border: `1px solid rgba(0,0,0,0.25)`,
              borderRadius: 5, padding: "3px 8px",
              outline: "none", fontFamily: "inherit",
              width: 200,
              caretColor: C.text,
            }}
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            title="프로젝트 이름 편집"
            style={{
              fontSize: 14, fontWeight: 600, color: "rgba(0,0,0,0.7)",
              background: "transparent", border: "none",
              cursor: "text", padding: "3px 6px", borderRadius: 5,
              maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "inherit",
              transition: "color 0.1s",
              flexShrink: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#000000"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(0,0,0,0.7)"; }}
          >
            {projectName}
          </button>
        )}

        {/* Version history clock button */}
        {onVersionHistory && (
          <VersionClockBtn onClick={onVersionHistory} />
        )}

        {/* Save / AI loading indicator */}
        {saving === "saving" && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Spinner color={C.muted} />
            <span style={{ fontSize: 11, color: C.muted }}>저장 중</span>
          </div>
        )}
        {saving === "saved" && (
          <span style={{ fontSize: 11, color: C.green, flexShrink: 0 }}>✓ 저장됨</span>
        )}
        {aiLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: C.accent,
              boxShadow: `0 0 8px ${C.accent}`,
              animation: "topbar-pulse 1.2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 500 }}>생성 중</span>
          </div>
        )}
      </div>

      {/* ── CENTER: Code / Preview tabs ────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 2,
        flexShrink: 0,
      }}>
        <TabBtn
          active={activeTab === "code"}
          onClick={() => onTabChange?.("code")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 3.5L1 6l2.5 2.5M8.5 3.5L11 6l-2.5 2.5M7 2l-2 8"/>
          </svg>
          코드
        </TabBtn>
        <TabBtn
          active={activeTab === "preview"}
          onClick={() => onTabChange?.("preview")}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="2" width="10" height="8" rx="1.5"/>
            <path d="M1 4.5h10"/>
            <circle cx="3" cy="3.25" r=".5" fill="currentColor" stroke="none"/>
            <circle cx="5" cy="3.25" r=".5" fill="currentColor" stroke="none"/>
          </svg>
          프리뷰
        </TabBtn>
      </div>

      {/* ── RIGHT: Deploy button ───────────────────────────────────────── */}
      <button
        onClick={publishProject}
        disabled={publishing}
        title="배포 — 공개 링크 생성"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: publishing
            ? "rgba(0,0,0,0.4)"
            : "#0a0a0a",
          color: "#ffffff",
          fontSize: 13, fontWeight: 700,
          cursor: publishing ? "default" : "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
          transition: "opacity 0.15s, box-shadow 0.15s",
          boxShadow: publishing ? "none" : "0 2px 8px rgba(0,0,0,0.18)",
          opacity: publishing ? 0.6 : 1,
        }}
        onMouseEnter={e => { if (!publishing) e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.28)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = publishing ? "none" : "0 2px 8px rgba(0,0,0,0.18)"; }}
      >
        {publishing && <Spinner color="#fff" />}
        {publishing ? "배포 중..." : "배포"}
      </button>

      {/* keyframe injection */}
      <style>{`
        @keyframes topbar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export const WorkspaceTopBar = React.memo(WorkspaceTopBarInner);
