"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import dynamic from "next/dynamic";
import { PreviewHeaderToolbar } from "./PreviewHeaderToolbar";
import { ExplainPanel } from "./ExplainPanel";
import HistoryPanel from "./HistoryPanel";
import { AutoFixBanner } from "./AutoFixBanner";
import type { ThemeColors, FilesMap, LogEntry, AiMsg, PreviewWidth } from "./workspace.constants";
import { track } from "@/lib/analytics";

const SandpackPreviewPane = dynamic(
  () => import("./SandpackPreviewPane").then(m => ({ default: m.SandpackPreviewPane })),
  { ssr: false }
);

interface PreviewPanelProps {
  // theme
  theme: ThemeColors;

  // layout
  showEditor: boolean;
  isMobile: boolean;
  mobilePanelExt: "files" | "ai" | "preview";
  rightW: number;
  isFullPreview: boolean;
  multiPreview: boolean;
  previewWidth: PreviewWidth;
  previewPx: number | undefined;
  previewHeightPx: number | undefined;

  // preview state
  previewSrc: string;
  iframeKey: number;
  hasRun: boolean;
  sandpackMode: boolean;
  showConsole: boolean;
  showHistory: boolean;
  showExplain: boolean;

  // console state
  consoleH: number;
  draggingConsole: boolean;
  bottomTab: "console" | "terminal";
  logs: LogEntry[];
  errorCount: number;
  autoFixCountdown: number | null;

  // files (for SandpackPreviewPane + ExplainPanel)
  files: FilesMap;
  aiMsgs: AiMsg[];

  // device frame
  deviceFrame: { width: number; height: number; label: string } | null;

  // ai state
  aiLoading: boolean;
  aiInput: string;

  // callbacks
  runProject: () => void;
  autoTest: () => void;
  setDeviceFrame: (v: { width: number; height: number; label: string } | null) => void;
  setSandpackMode: Dispatch<SetStateAction<boolean>>;
  handleAutoTest: () => void;
  handleAbTest: () => void;
  handleAiDebug: () => void;
  handlePreviewError: (msg: string) => void;
  autoFixErrors: () => void;
  cancelAutoFixCountdown: () => void;
  setShowHistory: Dispatch<SetStateAction<boolean>>;
  setShowExplain: Dispatch<SetStateAction<boolean>>;
  setAiInput: (v: string) => void;
  setShowConsole: (v: boolean) => void;
  setBottomTab: (v: "console" | "terminal") => void;
  setLogs: (v: LogEntry[]) => void;
  startDragConsole: (e: React.MouseEvent) => void;
  touchDragConsole: (e: React.TouchEvent) => void;
}

export function PreviewPanel(props: PreviewPanelProps) {
  const {
    theme,
    showEditor, isMobile, mobilePanelExt, rightW, isFullPreview, multiPreview,
    previewWidth, previewPx, previewHeightPx,
    previewSrc, iframeKey, hasRun, sandpackMode, showConsole, showHistory, showExplain,
    consoleH, draggingConsole, bottomTab, logs, errorCount, autoFixCountdown,
    files, aiMsgs,
    deviceFrame,
    aiLoading, aiInput,
    runProject, autoTest, setDeviceFrame, setSandpackMode,
    handleAutoTest, handleAbTest, handleAiDebug, handlePreviewError,
    autoFixErrors, cancelAutoFixCountdown,
    setShowHistory, setShowExplain, setAiInput,
    setShowConsole, setBottomTab, setLogs,
    startDragConsole, touchDragConsole,
  } = props;

  const [reactExporting, setReactExporting] = useState(false);

  async function handleReactExport() {
    if (reactExporting) return;
    setReactExporting(true);
    track("react_export", {});
    try {
      const projectName = (aiMsgs[0]?.text?.slice(0, 60) ?? "DalkakApp").trim() || "DalkakApp";
      const res = await fetch("/api/projects/convert-react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, projectName }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: "변환 실패" }))) as { error: string };
        alert(`React 변환 실패: ${error}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Z0-9가-힣]/g, "-").slice(0, 40) || "dalkak-app"}-react.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("네트워크 오류로 React 변환에 실패했습니다.");
    } finally {
      setReactExporting(false);
    }
  }

  return (
    <div aria-label="미리보기" style={{
      flex: showEditor ? undefined : 55,
      width: showEditor ? (isMobile ? "100%" : rightW) : undefined,
      minWidth: showEditor ? undefined : 360,
      flexShrink: 0, display: isMobile && mobilePanelExt !== "preview" ? "none" : "flex", flexDirection: "column",
      background: theme.panel, overflow: "hidden",
      transition: "flex 0.3s ease, width 0.3s ease",
      ...(isFullPreview ? { position: "fixed", inset: 0, zIndex: 50, width: "100%", height: "100%" } : {}),
    }}>
      {/* Preview header */}
      <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <PreviewHeaderToolbar
            runProject={runProject}
            autoTest={autoTest}
            onDeviceChange={setDeviceFrame}
          />
          <button
            onClick={() => setSandpackMode(p => !p)}
            style={{
              padding: "3px 8px", fontSize: 11, border: "1px solid #e5e7eb",
              borderRadius: 4, background: sandpackMode ? "#f97316" : "#fff",
              color: sandpackMode ? "#fff" : "#6b7280", cursor: "pointer",
              fontFamily: "inherit", marginLeft: 4,
            }}
            title={sandpackMode ? "Sandpack 끄기 (일반 미리보기로 전환)" : "Sandpack 켜기 (React/npm 지원)"}
          >
            {sandpackMode ? "⚛ React ON" : "⚛ React"}
          </button>
        </div>
        {/* Feature 2: AI Auto-Test button — visible when app has been generated */}
        {hasRun && !isMobile && (
          <button
            onClick={handleAutoTest}
            disabled={aiLoading}
            title="AI가 코드를 분석하여 버그와 UX 문제를 찾아줍니다"
            style={{
              padding: "0 10px", height: 36, borderRadius: 0,
              border: "none", borderLeft: `1px solid ${theme.border}`,
              background: "transparent",
              color: aiLoading ? theme.muted : theme.accent,
              cursor: aiLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0, opacity: aiLoading ? 0.5 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            🧪 테스트
          </button>
        )}
        {/* A/B Test button — visible when there is a prompt to test */}
        {!isMobile && (
          <button
            onClick={handleAbTest}
            disabled={aiLoading || !aiInput.trim()}
            title="같은 프롬프트를 두 모델로 동시 실행하여 결과를 비교합니다"
            style={{
              padding: "0 10px", height: 36, borderRadius: 0,
              border: "none", borderLeft: `1px solid ${theme.border}`,
              background: "transparent",
              color: (aiLoading || !aiInput.trim()) ? theme.muted : "#0891b2",
              cursor: (aiLoading || !aiInput.trim()) ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0, opacity: (aiLoading || !aiInput.trim()) ? 0.5 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!aiLoading && aiInput.trim()) { e.currentTarget.style.background = "rgba(8,145,178,0.08)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            ⚡ A/B
          </button>
        )}
        {/* History button */}
        {!isMobile && (
          <button
            onClick={() => setShowHistory(p => !p)}
            title="이전 생성 프롬프트 재사용"
            style={{
              padding: "0 10px", height: 36, borderRadius: 0,
              border: "none", borderLeft: `1px solid ${theme.border}`,
              background: showHistory ? "rgba(129,140,248,0.12)" : "transparent",
              color: showHistory ? "#818cf8" : "#6b7280",
              cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            📜 히스토리
          </button>
        )}
        {/* Explain button — visible when app has been generated */}
        {hasRun && !isMobile && (
          <button
            onClick={() => { setShowExplain(p => { if (!p) track("explain_opened", {}); return !p; }); }}
            title="AI가 이 앱의 코드를 한국어로 설명해줍니다"
            style={{
              padding: "0 10px", height: 36, borderRadius: 0,
              border: "none", borderLeft: `1px solid ${theme.border}`,
              background: showExplain ? "rgba(249,115,22,0.12)" : "transparent",
              color: showExplain ? "#f97316" : "#ea580c",
              cursor: "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!showExplain) e.currentTarget.style.background = "rgba(249,115,22,0.08)"; }}
            onMouseLeave={e => { if (!showExplain) e.currentTarget.style.background = "transparent"; }}
          >
            🔍 설명
          </button>
        )}
        {/* React export button — visible when app has been generated */}
        {hasRun && !isMobile && (
          <button
            onClick={handleReactExport}
            disabled={reactExporting}
            title="생성된 앱을 React + Vite 프로젝트 ZIP으로 다운로드합니다"
            style={{
              padding: "0 10px", height: 36, borderRadius: 0,
              border: "none", borderLeft: `1px solid ${theme.border}`,
              background: "transparent",
              color: reactExporting ? theme.muted : "#22c55e",
              cursor: reactExporting ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0, opacity: reactExporting ? 0.5 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!reactExporting) e.currentTarget.style.background = "rgba(34,197,94,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {reactExporting ? "⏳ 변환 중…" : "⬇ React"}
          </button>
        )}
      </div>

      {/* Iframe container — single or multi-preview */}
      {multiPreview ? (
        /* ── Multi-preview: 3 devices side-by-side ── */
        <div style={{
          flex: 1, overflowX: "auto", overflowY: "auto", background: "#111118",
          display: "flex", flexWrap: "nowrap", justifyContent: "flex-start", alignItems: "flex-start",
          gap: 16, padding: 16,
        }}>
          {([
            { label: "Mobile", width: 375, height: 667 },
            { label: "Tablet", width: 768, height: 1024 },
            { label: "Desktop", width: 1280, height: 800 },
          ]).map(dev => (
            <div key={dev.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "#8b949e", fontWeight: 600 }}>{dev.label} ({dev.width}px)</span>
              <div style={{
                width: Math.min(dev.width, 400), height: Math.min(dev.height, 500),
                background: "#fff", borderRadius: 8, overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                border: "1px solid #30363d",
              }}>
                <iframe
                  key={`${iframeKey}-${dev.label}`}
                  srcDoc={previewSrc}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  referrerPolicy="no-referrer"
                  style={{
                    width: dev.width, height: dev.height, border: "none", display: "block",
                    transform: `scale(${Math.min(400 / dev.width, 500 / dev.height)})`,
                    transformOrigin: "0 0",
                  }}
                  title={`${dev.label} 미리보기`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Single preview ── */
        <div style={{
          flex: 1, overflow: "auto",
          background: previewWidth !== "full" ? "#111118" : "#fff",
          display: "flex", justifyContent: "center", alignItems: previewWidth !== "full" ? "flex-start" : "stretch",
        }}>
          <div style={{
            width: previewPx ?? "100%",
            minHeight: "100%",
            background: "#fff",
            boxShadow: previewWidth !== "full" ? "0 0 60px rgba(0,0,0,0.08)" : "none",
            flexShrink: 0,
            position: "relative",
          }}>
            {sandpackMode ? (
              <SandpackPreviewPane
                files={files}
                theme="light"
                showConsole={showConsole}
                onError={handlePreviewError}
              />
            ) : (
              <iframe
                key={iframeKey}
                srcDoc={previewSrc || '<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#999;background:#f5f5f5"><p>AI에게 무엇을 만들지 알려주세요</p></body></html>'}
                style={{ width: "100%", height: previewHeightPx ? `${previewHeightPx}px` : (previewPx ? "100vh" : "100%"), border: "none", display: "block" }}
                title="앱 미리보기"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                referrerPolicy="no-referrer"
              />
            )}
            {/* AI code explain panel — slides in from right */}
            <HistoryPanel
              open={showHistory}
              onClose={() => setShowHistory(false)}
              onSelect={(p) => { setAiInput(p); setShowHistory(false); }}
            />
            {showExplain && (
              <ExplainPanel
                html={files["index.html"]?.content ?? ""}
                css={files["style.css"]?.content ?? ""}
                js={files["script.js"]?.content ?? ""}
                appName={aiMsgs[0]?.text?.slice(0, 40) ?? "이 앱"}
                onClose={() => setShowExplain(false)}
              />
            )}

            {/* Error overlay — shows JS runtime errors directly in preview */}
            {errorCount > 0 && logs.filter(l => l.level === "error").length > 0 && (
              <div style={{
                position: "absolute", bottom: 44, left: 12, right: 12,
                background: "rgba(24,8,8,0.92)", backdropFilter: "blur(6px)",
                border: "1px solid #f87171", borderRadius: 8,
                padding: "10px 14px", maxHeight: 160, overflowY: "auto",
                zIndex: 39, pointerEvents: "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#f87171", fontWeight: 700 }}>⚠ {errorCount}개 오류</span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>— 콘솔 탭에서 전체 확인</span>
                </div>
                {logs.filter(l => l.level === "error").slice(-3).map((log, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#fca5a5", fontFamily: "monospace", marginBottom: 2, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {log.msg}
                  </div>
                ))}
              </div>
            )}
            {/* AI 자동 수정 배너 — 에러 감지 시 하단 오버레이 */}
            <AutoFixBanner
              autoFixErrors={autoFixErrors}
              onCancelCountdown={cancelAutoFixCountdown}
            />
          </div>
        </div>
      )}

      {/* ── Console (프리뷰 하단에 표시 — 에디터 모드에서도 접근 가능) ── */}
      {showConsole && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${theme.border}`, background: theme.topbar, transition: "height 0.2s ease" }}>
          {/* Console drag handle — mouse + touch */}
          <div
            onMouseDown={startDragConsole}
            onTouchStart={touchDragConsole}
            style={{ height: 8, cursor: "row-resize", background: draggingConsole ? theme.borderHi : "transparent", transition: "background 0.12s", touchAction: "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = theme.border)}
            onMouseLeave={e => { if (!draggingConsole) e.currentTarget.style.background = "transparent"; }}
          />
          {/* Console tabs */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${theme.border}`, padding: "0 12px", gap: 2 }}>
            {(["console", "terminal"] as const).map(tab => (
              <button key={tab} onClick={() => setBottomTab(tab)}
                style={{
                  padding: "7px 12px", fontSize: 11, fontWeight: 600,
                  border: "none", cursor: "pointer", fontFamily: "inherit", background: "transparent",
                  color: bottomTab === tab ? theme.accent : theme.muted,
                  borderBottom: bottomTab === tab ? `2px solid ${theme.accent}` : "2px solid transparent",
                  transition: "color 0.12s",
                }}>
                {tab === "console" ? "Console" : "Terminal"}
              </button>
            ))}
            {/* Error/warn count badges */}
            {logs.filter(l => l.level === "error").length > 0 && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(248,113,113,0.15)", color: theme.red, fontWeight: 700, marginLeft: 4 }}>
                {logs.filter(l => l.level === "error").length}
              </span>
            )}
            {logs.filter(l => l.level === "warn").length > 0 && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(251,146,60,0.15)", color: theme.warn, fontWeight: 700 }}>
                {logs.filter(l => l.level === "warn").length}
              </span>
            )}
            <div style={{ flex: 1 }} />
            {logs.filter(l => l.level === "error").length > 0 && (
              <button
                onClick={autoFixErrors}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  border: "none",
                  background: `linear-gradient(135deg,${theme.accent},${theme.accentB})`,
                  color: "#fff", cursor: "pointer", fontFamily: "inherit",
                }}>
                &#10022; AI 자동수정{autoFixCountdown !== null && <span style={{ opacity: 0.75 }}> ({autoFixCountdown}s)</span>}
              </button>
            )}
            {logs.filter(l => l.level === "error" || l.level === "warn").length > 0 && (
              <button
                onClick={handleAiDebug}
                disabled={aiLoading}
                title="AI가 에러를 분석하고 수정 방법을 제안합니다"
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  border: "none",
                  background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                  color: "#fff", cursor: aiLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", opacity: aiLoading ? 0.6 : 1,
                }}>
                🤖 AI 디버그
              </button>
            )}
            {/* Clear console */}
            <button onClick={() => setLogs([])} title="콘솔 비우기"
              style={{ padding: "3px 8px", border: "none", background: "transparent", color: theme.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit", borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
              onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
            >지우기</button>
            <button onClick={() => setShowConsole(false)} title="콘솔 닫기"
              style={{ padding: "4px 8px", border: "none", background: "transparent", color: theme.muted, cursor: "pointer", fontSize: 16, transition: "color 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.color = theme.text)}
              onMouseLeave={e => (e.currentTarget.style.color = theme.muted)}
            >&times;</button>
          </div>
          {/* Console content */}
          <div style={{ height: consoleH, overflow: "auto", padding: "8px 12px", fontSize: 11, fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: 1.6 }}>
            {logs.length === 0 ? (
              <div style={{ color: theme.muted, padding: "20px 0", textAlign: "center", fontSize: 12 }}>
                <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>{"\u2728"}</div>
                콘솔 출력이 여기에 표시됩니다
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{
                  padding: "3px 0", color: l.level === "error" ? theme.red : l.level === "warn" ? theme.warn : l.level === "info" ? theme.info : theme.muted,
                  borderBottom: `1px solid ${theme.border}`,
                }}>
                  <span style={{ color: "#9ca3af", marginRight: 8, fontSize: 10 }}>[{l.ts || new Date().toLocaleTimeString("ko-KR")}]</span>
                  {l.msg}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Console toggle bar */}
      {!showConsole && errorCount > 0 && (
        <button onClick={() => setShowConsole(true)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 12px", borderTop: `1px solid ${theme.border}`, flexShrink: 0, width: "100%",
            background: `linear-gradient(180deg, rgba(248,113,113,0.06) 0%, ${theme.topbar} 100%)`,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            color: theme.red, fontSize: 11, fontWeight: 600, transition: "all 0.15s",
          }}>
          <span>&#9888; {errorCount} errors</span>
          {autoFixCountdown !== null && (
            <span style={{ color: theme.accent, fontSize: 10, fontWeight: 700, background: `${theme.accent}15`, padding: "1px 6px", borderRadius: 6 }}>
              &#10022; 자동수정 {autoFixCountdown}s
            </span>
          )}
          <span style={{ color: theme.muted, fontWeight: 400 }}>&middot; 클릭하여 콘솔 열기</span>
        </button>
      )}
    </div>
  );
}
