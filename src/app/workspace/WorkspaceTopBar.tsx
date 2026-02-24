"use client";

import React from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  T, buildPreview, tokToUSD, AI_MODELS,
} from "./workspace.constants";
import type { Project } from "./workspace.constants";
import { ModelPicker } from "./ModelPicker";
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

  // Parameter store
  const buildMode = useParameterStore(s => s.buildMode);
  const setBuildMode = useParameterStore(s => s.setBuildMode);
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

  // Layout store
  const isMobile = useLayoutStore(s => s.isMobile);

  return (
    <div style={{
      height: 46, display: "flex", alignItems: "center", flexShrink: 0,
      background: T.topbar, borderBottom: `1px solid ${T.border}`,
      padding: "0 10px", gap: 6, zIndex: 30,
      boxShadow: "0 1px 0 rgba(255,255,255,0.03)",
    }}>
      {/* Logo */}
      <div onClick={() => router.push("/")} style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0, cursor: "pointer",
        background: `linear-gradient(135deg,${T.accent},${T.accentB})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 10, color: "#fff",
        boxShadow: "0 2px 12px rgba(249,115,22,0.3)",
      }}>D</div>

      <div style={{ width: 1, height: 16, background: T.border }} />

      {/* Project name + switcher */}
      <div style={{ position: "relative" }}>
        {editingName ? (
          <input ref={nameRef as React.RefObject<HTMLInputElement>} value={projectName}
            onChange={e => setProjectName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
            style={{
              fontSize: 12, fontWeight: 700, color: T.text,
              background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
              borderRadius: 6, padding: "3px 10px", outline: "none",
              fontFamily: "inherit", width: 170,
            }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span onClick={() => setEditingName(true)} style={{
              fontSize: 12, fontWeight: 700, color: T.text, cursor: "text",
              padding: "3px 6px", borderRadius: 6,
              maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{projectName}</span>
            <button onClick={e => { e.stopPropagation(); setShowProjects(!showProjects); }}
              style={{
                padding: "2px 5px", borderRadius: 5, border: `1px solid ${T.border}`,
                background: "rgba(255,255,255,0.04)", color: T.muted,
                cursor: "pointer", fontSize: 9, fontFamily: "inherit",
              }}>&#9662;</button>
          </div>
        )}
        {/* Project dropdown */}
        {showProjects && (
          <div onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
              zIndex: 300, minWidth: 230, overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
              <button onClick={() => { newProject(); showToast("🆕 새 프로젝트"); }}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: `${T.accent}18`, border: `1px solid ${T.borderHi}`,
                  color: T.accent, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>+ 새 프로젝트</button>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {projects.map(proj => (
                <div key={proj.id} onClick={() => loadProject(proj)}
                  style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                      {new Date(proj.updatedAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteProject(proj); }} title="삭제"
                    style={{ padding: "2px 6px", borderRadius: 4, border: "none", background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", lineHeight: 1 }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.red)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                  >&#10005;</button>
                </div>
              ))}
              {projects.length === 0 && (
                <div style={{ padding: "12px", fontSize: 11, color: T.muted, textAlign: "center" }}>저장된 프로젝트 없음</div>
              )}
            </div>

            {/* Inline delete confirmation */}
            {confirmDeleteProj && (
              <div style={{
                padding: "12px 14px", borderTop: `1px solid ${T.border}`,
                background: "rgba(248,113,113,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.red, marginBottom: 10 }}>
                  &quot;{confirmDeleteProj.name}&quot; 프로젝트를 삭제하시겠습니까?
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => { const name = confirmDeleteProj?.name; confirmDeleteProjectAction(); showToast(`🗑 "${name}" 삭제됨`); }}
                    style={{
                      padding: "6px 14px", borderRadius: 6, border: "none",
                      background: T.red, color: "#fff", fontSize: 11,
                      fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    확인
                  </button>
                  <button
                    onClick={() => setConfirmDeleteProj(null)}
                    style={{
                      padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border}`,
                      background: "rgba(255,255,255,0.05)", color: T.muted, fontSize: 11,
                      fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Undo */}
      {history.length > 0 && (
        <button onClick={revertHistory} title="되돌리기 (Ctrl+Z)"
          style={{
            padding: "4px 9px", borderRadius: 7, border: `1px solid ${T.border}`,
            background: "rgba(255,255,255,0.04)", color: T.muted,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>&#8617;</button>
      )}

      {/* Save indicator */}
      {saving !== "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
          {saving === "saving" ? (
            <>
              <div style={{ width: 8, height: 8, border: `1.5px solid ${T.muted}`, borderTopColor: T.green, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: T.muted }}>저장 중...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 10 }}>&#10003;</span>
              <span style={{ fontSize: 10, color: T.green }}>저장됨</span>
            </>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Build mode toggle -- hidden on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 7, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {(["fast", "full"] as const).map(mode => (
            <button key={mode} onClick={() => setBuildMode(mode)}
              title={mode === "fast" ? "빠른 빌드: 빠른 결과 우선" : "전체 빌드: 완성도 최우선"}
              style={{
                padding: "4px 9px", border: "none", fontSize: 10, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                background: buildMode === mode ? (mode === "full" ? `${T.accent}30` : "rgba(255,255,255,0.08)") : "transparent",
                color: buildMode === mode ? (mode === "full" ? T.accent : T.text) : T.muted,
              }}>
              {mode === "fast" ? "\u26A1\uBE60\uB978" : "\uD83D\uDD28\uC804\uCCB4"}
            </button>
          ))}
        </div>
      )}

      {/* Autonomy level -- hidden on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>자율성</span>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 7, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {([
              { id: "low" as const,    label: "Low",  color: "#60a5fa" },
              { id: "medium" as const, label: "Mid",  color: "#a78bfa" },
              { id: "high" as const,   label: "High", color: T.accent },
              { id: "max" as const,    label: "Max",  color: T.accentB },
            ] as const).map(a => (
              <button key={a.id} onClick={() => setAutonomyLevel(a.id)}
                title={`자율성 ${a.label}: ${a.id === "low" ? "모든 단계 확인" : a.id === "medium" ? "중요 결정만 확인" : a.id === "high" ? "완성 후 보고" : "완전 자율 실행"}`}
                style={{
                  padding: "4px 7px", border: "none", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                  background: autonomyLevel === a.id ? `${a.color}22` : "transparent",
                  color: autonomyLevel === a.id ? a.color : T.muted,
                }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly usage / token balance */}
      {monthlyUsage ? (
        <div onClick={() => router.push("/pricing")} title={`이번 달 사용 요금 \u00B7 한도 ${(monthlyUsage.hard_limit/1000).toFixed(0)}천원`}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7,
            border: `1px solid ${monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? T.borderHi : T.border}`,
            background: monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? `${T.accent}18` : "rgba(255,255,255,0.04)",
            cursor: "pointer",
          }}>
          <span style={{ fontSize: 10 }}>{"\uD83D\uDCB3"}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: monthlyUsage.amount_krw >= monthlyUsage.warn_threshold ? T.accent : T.text }}>
            {(monthlyUsage.amount_krw / 1000).toFixed(1)}천원
          </span>
          <span style={{ fontSize: 9, color: T.muted }}>/ {(monthlyUsage.hard_limit / 1000).toFixed(0)}천원</span>
          {monthlyUsage.amount_krw >= monthlyUsage.warn_threshold && (
            <span style={{ fontSize: 9, color: T.accent }}>{"\u26A0\uFE0F"}</span>
          )}
        </div>
      ) : (
        <div onClick={() => router.push("/pricing")} title="토큰 잔액 \u00B7 클릭하여 업그레이드"
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7,
            border: `1px solid ${tokenBalance < 2000 ? T.borderHi : T.border}`,
            background: tokenBalance < 2000 ? `${T.accent}18` : "rgba(255,255,255,0.04)",
            cursor: "pointer",
          }}>
          <span style={{ fontSize: 10 }}>{"\u26A1"}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: tokenBalance < 2000 ? T.accent : T.text }}>
            {tokenBalance.toLocaleString()}
          </span>
          <span style={{ fontSize: 9, color: T.muted }}>{tokToUSD(tokenBalance)}</span>
        </div>
      )}

      {/* CDN -- hidden on mobile */}
      {!isMobile && <button onClick={() => setShowCdnModal(true)} title="패키지 관리자"
        style={{
          padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.border}`,
          background: cdnUrls.length > 0 ? `${T.accent}18` : "rgba(255,255,255,0.04)",
          color: cdnUrls.length > 0 ? T.accent : T.muted,
          fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 5,
        }}>
        <span>{"\uD83D\uDCE6"}</span>
        {cdnUrls.length > 0 && (
          <span style={{ background: T.accent, color: "#fff", borderRadius: 10, padding: "0 5px", fontSize: 9 }}>{cdnUrls.length}</span>
        )}
      </button>}

      {/* Model Picker */}
      <ModelPicker
        models={AI_MODELS}
        selectedModelId={selectedModelId}
        onSelect={handleSelectModel}
      />

      {/* Run */}
      <button onClick={runProject} title="실행 (Ctrl+Enter)"
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 8,
          background: `linear-gradient(135deg,${T.green},#16a34a)`,
          color: "#fff", border: "none", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          boxShadow: "0 2px 14px rgba(34,197,94,0.25)",
        }}>
        <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg>
        실행
      </button>

      {/* Publish */}
      <button onClick={publishProject} disabled={publishing} title="배포 \u2014 공유 링크 생성"
        style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7,
          border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)",
          color: publishing ? T.muted : T.text, fontSize: 11,
          cursor: publishing ? "default" : "pointer", fontFamily: "inherit",
        }}>
        {publishing
          ? <div style={{ width: 10, height: 10, border: `1.5px solid ${T.muted}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          : <span>{"\uD83D\uDE80"}</span>}
        {publishing ? "배포 중..." : "배포"}
      </button>

      {/* Share -- hidden on mobile */}
      {!isMobile && (
        <button onClick={shareProject} title="공유/내보내기"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9.5" cy="2" r="1.5"/><circle cx="2" cy="6" r="1.5"/><circle cx="9.5" cy="10" r="1.5"/>
            <path d="M3.5 5.1l4.5-2.6M8 9.5L3.5 6.9"/>
          </svg>
        </button>
      )}

      {/* Download -- hidden on mobile */}
      {!isMobile && (
        <button onClick={() => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" }));
          a.download = `${projectName}.html`; a.click(); showToast("\uD83D\uDCE6 다운로드됨");
        }} title="다운로드"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1v8M3 6l3 3 3-3M1 11h10"/>
          </svg>
        </button>
      )}

      {/* Open in tab -- hidden on mobile */}
      {!isMobile && (
        <button onClick={() => window.open(URL.createObjectURL(new Blob([buildPreview(files)], { type: "text/html" })), "_blank")}
          title="새 탭에서 열기"
          style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M6.5 1h3.5v3.5M10 1L4.5 6.5"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export const WorkspaceTopBar = React.memo(WorkspaceTopBarInner);
