"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  T, buildPreview, tokToUSD, AI_MODELS, ALL_EDITOR_THEMES,
} from "./workspace.constants";
import type { Project } from "./workspace.constants";
import { scanSecurity, getSecurityGradeLabel } from "./ai/securityScanner";
import type { SecurityIssue } from "./ai/securityScanner";
import { clientSideReview, getReviewGradeLabel } from "./ai/codeReview";
import { ModelPicker } from "./ModelPicker";
import { StackBlitzButton } from "./StackBlitzButton";
import { PipelineStatsCard, PIPELINE_STATS_KEY } from "./PipelineStatsCard";
import {
  useUiStore,
  useProjectStore,
  useFileSystemStore,
  useParameterStore,
  useTokenStore,
  useEnvStore,
  useAiStore,
  useLayoutStore,
} from "./stores";

// ── Design tokens (always dark, regardless of theme toggle) ──────────────────
const C = {
  bg:       "#0d1117",
  surface:  "#161b22",
  surfaceHi:"#1c2128",
  border:   "rgba(255,255,255,0.08)",
  borderHi: "rgba(249,115,22,0.4)",
  text:     "#e6edf3",
  muted:    "#8b949e",
  mutedHi:  "#adb8c3",
  accent:   "#f97316",
  accentDim:"rgba(249,115,22,0.12)",
  green:    "#3fb950",
  red:      "#f85149",
} as const;

// ── Ghost button (transparent, hover reveals orange outline) ─────────────────
interface GhostBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  accentActive?: boolean;
  size?: "sm" | "md";
}
function GhostBtn({ children, active, accentActive, size = "md", style, ...rest }: GhostBtnProps) {
  const [hover, setHover] = useState(false);
  const h = size === "sm" ? 28 : 30;
  return (
    <button
      {...rest}
      onMouseEnter={e => { setHover(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={e => { setHover(false); rest.onMouseLeave?.(e); }}
      style={{
        height: h, minWidth: h,
        padding: size === "sm" ? "0 6px" : "0 8px",
        borderRadius: 6,
        border: `1px solid ${active || hover ? (accentActive ? C.borderHi : C.border) : C.border}`,
        background: active ? C.accentDim : hover ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? C.accent : hover ? C.mutedHi : C.muted,
        cursor: rest.disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 5,
        fontSize: 12,
        fontFamily: "inherit",
        fontWeight: 500,
        transition: "border-color 0.12s, background 0.12s, color 0.12s",
        flexShrink: 0,
        opacity: rest.disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Primary action button (orange gradient) ───────────────────────────────────
interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}
function PrimaryBtn({ children, loading, style, ...rest }: PrimaryBtnProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...rest}
      onMouseEnter={e => { setHover(true); rest.onMouseEnter?.(e); }}
      onMouseLeave={e => { setHover(false); rest.onMouseLeave?.(e); }}
      style={{
        height: 30, padding: "0 14px",
        borderRadius: 6,
        border: "1px solid rgba(249,115,22,0.5)",
        background: hover
          ? "linear-gradient(135deg, #fb923c 0%, #f97316 100%)"
          : "linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)",
        color: "#fff",
        fontSize: 12, fontWeight: 700,
        cursor: rest.disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "inherit",
        flexShrink: 0,
        opacity: rest.disabled ? 0.55 : 1,
        boxShadow: hover ? "0 0 16px rgba(249,115,22,0.35)" : "0 0 8px rgba(249,115,22,0.2)",
        transition: "background 0.12s, box-shadow 0.12s",
        ...style,
      }}
    >
      {loading
        ? <span style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
        : children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0, margin: "0 2px" }} />;
}

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

// ─────────────────────────────────────────────────────────────────────────────

export interface WorkspaceTopBarProps {
  router: AppRouterInstance;
  nameRef: React.RefObject<HTMLInputElement | null>;
  runProject: () => void;
  publishProject: () => void;
  shareProject: () => void;
  loadProject: (p: Project) => void;
}

function WorkspaceTopBarInner({
  router, nameRef,
  runProject, publishProject, shareProject, loadProject,
}: WorkspaceTopBarProps) {
  // UI store
  const editingName = useUiStore(s => s.editingName);
  const setEditingName = useUiStore(s => s.setEditingName);
  const saving = useUiStore(s => s.saving);
  const publishing = useUiStore(s => s.publishing);
  const setShowCdnModal = useUiStore(s => s.setShowCdnModal);
  const showToast = useUiStore(s => s.showToast);

  // Project store
  const projectName = useProjectStore(s => s.projectName);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const showProjects = useProjectStore(s => s.showProjects);
  const setShowProjects = useProjectStore(s => s.setShowProjects);
  const projects = useProjectStore(s => s.projects);
  const confirmDeleteProj = useProjectStore(s => s.confirmDeleteProj);
  const setConfirmDeleteProj = useProjectStore(s => s.setConfirmDeleteProj);
  const newProject = useProjectStore(s => s.newProject);
  const deleteProject = useProjectStore(s => s.deleteProject);
  const confirmDeleteProjectAction = useProjectStore(s => s.confirmDeleteProjectAction);

  // FileSystem store
  const history = useFileSystemStore(s => s.history);
  const revertHistory = useFileSystemStore(s => s.revertHistory);
  const files = useFileSystemStore(s => s.files);
  const setFiles = useFileSystemStore(s => s.setFiles);
  const setOpenTabs = useFileSystemStore(s => s.setOpenTabs);
  const setActiveFile = useFileSystemStore(s => s.setActiveFile);

  // Parameter store
  const buildMode = useParameterStore(s => s.buildMode);
  const setBuildMode = useParameterStore(s => s.setBuildMode);
  const commercialMode = useParameterStore(s => s.commercialMode);
  const setCommercialMode = useParameterStore(s => s.setCommercialMode);
  const agentMode = useParameterStore(s => s.agentMode);
  const setAgentMode = useParameterStore(s => s.setAgentMode);
  const themeMode = useParameterStore(s => s.themeMode);
  const setThemeMode = useParameterStore(s => s.setThemeMode);
  const editorTheme = useParameterStore(s => s.editorTheme);
  const setEditorTheme = useParameterStore(s => s.setEditorTheme);
  const showMinimap = useParameterStore(s => s.showMinimap);
  const setShowMinimap = useParameterStore(s => s.setShowMinimap);
  const autonomyLevel = useParameterStore(s => s.autonomyLevel);
  const setAutonomyLevel = useParameterStore(s => s.setAutonomyLevel);

  // Token store
  const monthlyUsage = useTokenStore(s => s.monthlyUsage);
  const tokenBalance = useTokenStore(s => s.tokenBalance);

  // Env store
  const cdnUrls = useEnvStore(s => s.cdnUrls);

  // AI store
  const selectedModelId = useAiStore(s => s.selectedModelId);
  const handleSelectModel = useAiStore(s => s.handleSelectModel);
  const aiLoading = useAiStore(s => s.aiLoading);

  // Layout store
  const isMobile = useLayoutStore(s => s.isMobile);

  // README generator state
  const [generatingReadme, setGeneratingReadme] = useState(false);

  // Pipeline stats card state
  const [showPipelineStats, setShowPipelineStats] = useState(false);
  const [hasPipelineData, setHasPipelineData] = useState(false);
  const pipelineStatsRef = useRef<HTMLDivElement>(null);

  // Project dropdown search
  const [projSearch, setProjSearch] = useState("");

  useEffect(() => {
    const checkStats = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(PIPELINE_STATS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { team?: { totalRuns?: number } };
          setHasPipelineData((parsed.team?.totalRuns ?? 0) > 0);
        }
      } catch { /* ignore */ }
    };
    checkStats();
    window.addEventListener("storage", checkStats);
    const interval = setInterval(checkStats, 5000);
    return () => { window.removeEventListener("storage", checkStats); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!showPipelineStats) return;
    const handler = (e: MouseEvent) => {
      if (pipelineStatsRef.current && !pipelineStatsRef.current.contains(e.target as Node)) {
        setShowPipelineStats(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPipelineStats]);

  const handleGenerateReadme = useCallback(async () => {
    setGeneratingReadme(true);
    try {
      const res = await fetch("/api/ai/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, projectName }),
      });
      const { readme } = await res.json() as { readme: string };
      if (readme) {
        setFiles((prev) => ({
          ...prev,
          "README.md": { name: "README.md", content: readme, language: "markdown" },
        }));
        setOpenTabs((prev) => (prev.includes("README.md") ? prev : [...prev, "README.md"]));
        setActiveFile("README.md");
        showToast("README.md 생성됨!");
      } else {
        showToast("README 생성 실패 — index.html이 너무 짧거나 API 키 없음");
      }
    } catch {
      showToast("README 생성 중 오류 발생");
    } finally {
      setGeneratingReadme(false);
    }
  }, [files, projectName, setFiles, setOpenTabs, setActiveFile, showToast]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projSearch.toLowerCase())
  );

  return (
    <div style={{
      height: 48,
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      background: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: "0 12px",
      gap: 4,
      zIndex: 30,
      boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
    }}>

      {/* ── Logo mark ──────────────────────────────────────────────────── */}
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

      {/* ── Brand name ─────────────────────────────────────────────────── */}
      <span style={{
        fontSize: 13, fontWeight: 800, color: C.accent,
        letterSpacing: "-0.02em",
        marginLeft: 4, flexShrink: 0,
      }}>딸깍</span>

      <Divider />

      {/* ── Project name (breadcrumb style, click-to-edit) ─────────────── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        {editingName ? (
          <input
            ref={nameRef as React.RefObject<HTMLInputElement>}
            value={projectName}
            onChange={e => { if (e.target.value.length <= 50) setProjectName(e.target.value); }}
            onBlur={() => {
              if (!projectName.trim()) setProjectName("내 프로젝트");
              setEditingName(false);
            }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") { setEditingName(false); } }}
            style={{
              fontSize: 13, fontWeight: 600, color: C.text,
              background: C.surfaceHi,
              border: `1px solid ${C.borderHi}`,
              borderRadius: 5, padding: "3px 8px",
              outline: "none", fontFamily: "inherit",
              width: 180,
              caretColor: C.accent,
            }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => setEditingName(true)}
              title="프로젝트 이름 편집"
              style={{
                fontSize: 13, fontWeight: 600, color: C.text,
                background: "transparent", border: "none",
                cursor: "text", padding: "3px 6px", borderRadius: 5,
                maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: "inherit",
                transition: "color 0.1s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.mutedHi; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.text; }}
            >
              {projectName}
            </button>
            {/* Project switcher chevron */}
            <button
              onClick={e => { e.stopPropagation(); setShowProjects(!showProjects); setProjSearch(""); }}
              title="프로젝트 전환"
              style={{
                width: 20, height: 20, borderRadius: 4,
                border: `1px solid ${showProjects ? C.borderHi : "transparent"}`,
                background: showProjects ? C.accentDim : "transparent",
                color: showProjects ? C.accent : C.muted,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontFamily: "inherit",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.mutedHi; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = showProjects ? C.accent : C.muted; e.currentTarget.style.background = showProjects ? C.accentDim : "transparent"; }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </button>
          </div>
        )}

        {/* ── Project dropdown ─────────────────────────────────────────── */}
        {showProjects && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              zIndex: 300, minWidth: 240, overflow: "hidden",
            }}
          >
            {/* Actions row */}
            <div style={{ padding: "10px 10px 8px", display: "flex", gap: 6, borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => { newProject(); showToast("새 프로젝트 생성됨"); setShowProjects(false); }}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 6,
                  background: C.accentDim,
                  border: `1px solid ${C.borderHi}`,
                  color: C.accent, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.accentDim; }}
              >
                + 새 프로젝트
              </button>
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = ".html,.zip";
                  input.onchange = (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => { newProject(); showToast(`"${file.name}" 임포트 완료`); };
                    reader.readAsText(file);
                  };
                  input.click();
                }}
                style={{
                  padding: "7px 10px", borderRadius: 6,
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.muted, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "color 0.1s, border-color 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.mutedHi; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
              >
                Import
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <input
                autoFocus
                placeholder="프로젝트 검색..."
                value={projSearch}
                onChange={e => setProjSearch(e.target.value)}
                style={{
                  width: "100%", padding: "5px 8px", borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surfaceHi, color: C.text,
                  fontSize: 11, outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                  caretColor: C.accent,
                }}
              />
            </div>

            {/* Project list */}
            <div style={{ maxHeight: 232, overflowY: "auto" }}>
              {filteredProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => { loadProject(proj); setShowProjects(false); }}
                  style={{
                    padding: "9px 12px", cursor: "pointer",
                    borderBottom: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "background 0.08s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: "rgba(249,115,22,0.1)",
                    border: `1px solid rgba(249,115,22,0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: C.accent, fontWeight: 800,
                  }}>
                    {(proj.name[0] ?? "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {proj.name}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                      {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteProject(proj); }}
                    title="삭제"
                    style={{
                      width: 22, height: 22, borderRadius: 4, border: "none",
                      background: "transparent", color: C.muted,
                      fontSize: 12, cursor: "pointer", flexShrink: 0,
                      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "color 0.1s, background 0.1s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.background = "rgba(248,81,73,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "transparent"; }}
                  >
                    &#10005;
                  </button>
                </div>
              ))}
              {filteredProjects.length === 0 && (
                <div style={{ padding: "16px", fontSize: 12, color: C.muted, textAlign: "center" }}>
                  {projSearch ? `"${projSearch}"` : "저장된 프로젝트"} 없음
                </div>
              )}
            </div>

            {/* Inline delete confirmation */}
            {confirmDeleteProj && (
              <div style={{
                padding: "12px",
                borderTop: `1px solid ${C.border}`,
                background: "rgba(248,81,73,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.red, marginBottom: 10 }}>
                  &quot;{confirmDeleteProj.name}&quot; 삭제할까요?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => {
                      const name = confirmDeleteProj?.name;
                      confirmDeleteProjectAction();
                      showToast(`"${name}" 삭제됨`);
                    }}
                    style={{
                      padding: "5px 14px", borderRadius: 5, border: "none",
                      background: C.red, color: "#fff", fontSize: 11,
                      fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >삭제</button>
                  <button
                    onClick={() => setConfirmDeleteProj(null)}
                    style={{
                      padding: "5px 14px", borderRadius: 5,
                      border: `1px solid ${C.border}`,
                      background: "transparent", color: C.muted, fontSize: 11,
                      fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >취소</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Undo ───────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <GhostBtn onClick={revertHistory} title={`되돌리기 (Ctrl+Z) — ${history.length}개`} size="sm">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4H8a3 3 0 010 6H5"/>
            <path d="M2 1.5L2 6.5L6.5 4"/>
          </svg>
        </GhostBtn>
      )}

      {/* ── Save indicator ─────────────────────────────────────────────── */}
      {saving !== "idle" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 8px", borderRadius: 5,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {saving === "saving"
            ? <><Spinner color={C.muted} /><span style={{ fontSize: 10, color: C.muted }}>저장 중</span></>
            : <><span style={{ fontSize: 10, color: C.green }}>&#10003;</span><span style={{ fontSize: 10, color: C.green }}>저장됨</span></>
          }
        </div>
      )}

      {/* ── AI loading pulse ────────────────────────────────────────────── */}
      {aiLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
            animation: "topbar-pulse 1.2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 10, color: C.accent, fontWeight: 500 }}>생성 중</span>
        </div>
      )}

      {/* ── Spacer ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }} />

      {/* ── Agent mode (Economy / Power / Turbo) ─────────────────────── */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>Agent</span>
          <div style={{
            display: "flex",
            background: C.bg,
            borderRadius: 6,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            padding: 2,
            gap: 2,
          }}>
            {([
              { id: "economy" as const, label: "⚡ Economy", color: "#60a5fa", title: "Economy: 빠른 응답, 최소 비용" },
              { id: "power"   as const, label: "🔥 Power",   color: C.accent,  title: "Power: 상용급, 균형 성능" },
              { id: "turbo"   as const, label: "🌟 Turbo",   color: "#e879f9",  title: "Turbo: 풀 파이프라인 강제, 자체평가 루프" },
            ] as const).map(a => (
              <button
                key={a.id}
                onClick={() => setAgentMode(a.id)}
                title={a.title}
                style={{
                  padding: "3px 8px", borderRadius: 4,
                  border: agentMode === a.id ? `1px solid ${a.color}44` : "1px solid transparent",
                  fontSize: 10, fontWeight: agentMode === a.id ? 700 : 500,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.12s",
                  background: agentMode === a.id
                    ? a.id === "turbo"
                      ? "linear-gradient(135deg, rgba(244,63,94,0.2) 0%, rgba(232,121,249,0.2) 100%)"
                      : `${a.color}18`
                    : "transparent",
                  color: agentMode === a.id ? a.color : C.muted,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Divider />

      {/* ── Theme toggle ───────────────────────────────────────────────── */}
      <GhostBtn
        onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
        title={themeMode === "dark" ? "라이트 모드" : "다크 모드"}
        size="sm"
      >
        {themeMode === "dark"
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 2a8 8 0 110-16 8 8 0 010 16z" opacity=".3"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </GhostBtn>

      {/* ── Pipeline stats ─────────────────────────────────────────────── */}
      {!isMobile && (
        <div ref={pipelineStatsRef} style={{ position: "relative" }}>
          <GhostBtn
            onClick={() => setShowPipelineStats(v => !v)}
            title="파이프라인 통계"
            active={showPipelineStats}
            accentActive
            size="sm"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M1 9V6M4 9V4M7 9V2M10 9V5"/>
            </svg>
            {hasPipelineData && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 5, height: 5, borderRadius: "50%",
                background: C.green,
                boxShadow: `0 0 4px ${C.green}`,
              }} />
            )}
          </GhostBtn>
          {showPipelineStats && (
            <PipelineStatsCard onClose={() => setShowPipelineStats(false)} />
          )}
        </div>
      )}

      {/* ── Security scan + Code review ─────────────────────────────────── */}
      <GhostBtn
        title="보안 스캔 + 코드 리뷰"
        size="sm"
        onClick={() => {
          const fileContents: Record<string, string> = {};
          for (const [k, v] of Object.entries(files)) fileContents[k] = v.content;
          const secReport = scanSecurity(fileContents);
          const secLabel = getSecurityGradeLabel(secReport.grade);
          const crReport = clientSideReview(fileContents);
          const crLabel = getReviewGradeLabel(crReport.grade);
          const topIssues = [...secReport.issues, ...crReport.issues]
            .sort((a, b) => {
              const sev = { critical: 0, error: 0, high: 1, warning: 1, medium: 2, info: 3, suggestion: 3, low: 4 } as Record<string, number>;
              return (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9);
            })
            .slice(0, 5)
            .map(i => `[${i.severity}] ${i.title}`)
            .join("\n");
          showToast(`보안 ${secReport.grade}(${secLabel}) ${secReport.score}/100 · 리뷰 ${crReport.grade}(${crLabel}) ${crReport.score}/100\n${topIssues || "이슈 없음"}`);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 1L11 3.5V6c0 2.8-2.2 4.7-5 5.5C3.2 10.7 1 8.8 1 6V3.5L6 1z"/>
          <path d="M4 6l1.5 1.5L8 4"/>
        </svg>
      </GhostBtn>

      {/* ── Minimap toggle ─────────────────────────────────────────────── */}
      <GhostBtn
        onClick={() => setShowMinimap(!showMinimap)}
        title={showMinimap ? "미니맵 끄기" : "미니맵 켜기"}
        active={showMinimap}
        accentActive
        size="sm"
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <rect x="1" y="1" width="10" height="8" rx="1.5"/>
          <path d="M8 1v8"/>
          <rect x="8.5" y="3" width="2" height="1.5" rx=".5" fill="currentColor" stroke="none"/>
        </svg>
      </GhostBtn>

      {/* ── Editor theme picker ─────────────────────────────────────────── */}
      <select
        value={editorTheme}
        onChange={e => setEditorTheme(e.target.value)}
        title="에디터 테마"
        style={{
          height: 28, padding: "0 4px",
          borderRadius: 6, border: `1px solid ${C.border}`,
          background: C.surfaceHi, color: C.muted,
          fontSize: 10, fontFamily: "inherit", cursor: "pointer",
          appearance: "none" as const,
          maxWidth: 72, flexShrink: 0,
          outline: "none",
        }}
      >
        {ALL_EDITOR_THEMES.map(t => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>

      {/* ── CDN / packages ─────────────────────────────────────────────── */}
      {!isMobile && (
        <GhostBtn
          onClick={() => setShowCdnModal(true)}
          title="패키지 관리자"
          active={cdnUrls.length > 0}
          accentActive
          size="sm"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1l5 2.5V9L6 11.5 1 9V3.5L6 1z"/>
            <path d="M1 3.5L6 6M11 3.5L6 6M6 6v5.5"/>
          </svg>
          {cdnUrls.length > 0 && (
            <span style={{
              background: C.accent, color: "#fff",
              borderRadius: 8, padding: "0 4px", fontSize: 9, fontWeight: 700,
              lineHeight: "14px",
            }}>{cdnUrls.length}</span>
          )}
        </GhostBtn>
      )}

      {/* ── Model picker ───────────────────────────────────────────────── */}
      <ModelPicker
        models={AI_MODELS}
        selectedModelId={selectedModelId}
        onSelect={handleSelectModel}
      />

      <Divider />

      {/* ── Token balance pill ─────────────────────────────────────────── */}
      {!isMobile && (
        <div
          onClick={() => router.push("/pricing")}
          title="크레딧 잔액 · 클릭하여 충전"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 20,
            border: `1px solid ${
              monthlyUsage
                ? monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? C.borderHi : C.border
                : (tokenBalance ?? 0) < 2000 ? C.borderHi : C.border
            }`,
            background: (
              monthlyUsage
                ? monthlyUsage.amount_krw >= monthlyUsage.warn_threshold
                : (tokenBalance ?? 0) < 2000
            ) ? C.accentDim : "rgba(255,255,255,0.03)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "border-color 0.15s",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill={
            (monthlyUsage
              ? monthlyUsage.amount_krw >= monthlyUsage.warn_threshold
              : (tokenBalance ?? 0) < 2000
            ) ? C.accent : C.muted
          }>
            <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" fill="none"/>
            <path d="M5 2v1.5M5 6.5V8M3.5 4.5h3a.5.5 0 010 1h-3a.5.5 0 010-1z" fill="currentColor" stroke="none"/>
          </svg>
          {monthlyUsage ? (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? C.accent : C.text,
            }}>
              {(monthlyUsage.amount_krw / 1000).toFixed(1)}천원
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 400 }}> / {(monthlyUsage.hard_limit / 1000).toFixed(0)}천</span>
            </span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: (tokenBalance ?? 0) < 2000 ? C.accent : C.text,
            }}>
              {Math.max(0, tokenBalance ?? 0).toLocaleString()}
              {(tokenBalance ?? 0) < 2000 && <span style={{ fontSize: 9, color: C.accent, marginLeft: 3 }}>충전 →</span>}
            </span>
          )}
        </div>
      )}

      <Divider />

      {/* ── Share ───────────────────────────────────────────────────────── */}
      {!isMobile && (
        <GhostBtn onClick={shareProject} title="공유 / 내보내기" size="sm">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9.5" cy="2" r="1.5"/>
            <circle cx="2" cy="6" r="1.5"/>
            <circle cx="9.5" cy="10" r="1.5"/>
            <path d="M3.5 5.1l4.5-2.6M8 9.5L3.5 6.9"/>
          </svg>
          <span>공유</span>
        </GhostBtn>
      )}

      {/* ── Publish (배포) ──────────────────────────────────────────────── */}
      <GhostBtn
        onClick={publishProject}
        disabled={publishing}
        title="배포 — 공개 링크 생성"
        size="sm"
      >
        {publishing
          ? <Spinner color={C.accent} />
          : <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 1L5.5 7M3 3.5L5.5 1 8 3.5M1 9.5h9"/>
            </svg>
        }
        <span>{publishing ? "배포 중..." : "배포"}</span>
      </GhostBtn>

      {/* ── Run (실행) — primary CTA ────────────────────────────────────── */}
      <PrimaryBtn onClick={runProject} title="실행 (Ctrl+Enter)">
        <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
          <path d="M0.5 1L8.5 5L0.5 9V1Z"/>
        </svg>
        실행
      </PrimaryBtn>

      {/* ── Overflow utilities (hidden on mobile) ───────────────────────── */}
      {!isMobile && (
        <>
          {/* README */}
          <GhostBtn
            onClick={handleGenerateReadme}
            disabled={generatingReadme}
            title="AI README 생성"
            size="sm"
          >
            {generatingReadme
              ? <Spinner color={C.accent} />
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="1" width="8" height="10" rx="1.5"/>
                  <path d="M4 4h4M4 6.5h4M4 9h2"/>
                </svg>
            }
          </GhostBtn>

          {/* Download ZIP */}
          <GhostBtn
            title="ZIP으로 내보내기"
            size="sm"
            onClick={async () => {
              try {
                const { default: JSZip } = await import("jszip");
                const zip = new JSZip();
                for (const [fname, f] of Object.entries(files)) zip.file(fname, f.content);
                const blob = await zip.generateAsync({ type: "blob" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `${projectName}.zip`;
                a.click();
                showToast("ZIP 다운로드됨");
              } catch {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" }));
                a.download = `${projectName}.html`;
                a.click();
                showToast("HTML 다운로드됨");
              }
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M1.5 10.5h9"/>
            </svg>
          </GhostBtn>

          {/* StackBlitz */}
          <StackBlitzButton files={files} projectName={projectName} />

          {/* Open in new tab */}
          <GhostBtn
            title="새 탭에서 열기"
            size="sm"
            onClick={() => window.open(URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" })), "_blank")}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M6.5 1h3.5v3.5M10 1L4.5 6.5"/>
            </svg>
          </GhostBtn>
        </>
      )}

      {/* keyframe injection */}
      <style>{`
        @keyframes topbar-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

export const WorkspaceTopBar = React.memo(WorkspaceTopBarInner);
