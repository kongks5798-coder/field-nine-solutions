"use client";

import React from "react";
import { T } from "./workspace.constants";
import {
  usePreviewStore,
  useEditorStore,
  useTokenStore,
  useAiStore,
  useFileSystemStore,
  useLayoutStore,
  useCollabStore,
  useGitStore,
  usePackageStore,
  useDeployStore,
  useAutonomousStore,
} from "./stores";

const LANG_LABELS: Record<string, string> = {
  html: "HTML", css: "CSS", javascript: "JavaScript",
  typescript: "TypeScript", python: "Python", json: "JSON", markdown: "Markdown",
};

const MODEL_LABELS: Record<string, string> = {
  openai: "GPT-4o", anthropic: "Claude 3.5", gemini: "Gemini 1.5", grok: "Grok",
};

interface Props {
  onClickErrors: () => void;
}

export function StatusBar({ onClickErrors }: Props) {
  const errorCount = usePreviewStore(s => s.errorCount);
  const logs = usePreviewStore(s => s.logs);
  const cursorLine = useEditorStore(s => s.cursorLine);
  const cursorCol = useEditorStore(s => s.cursorCol);
  const tokenBalance = useTokenStore(s => s.tokenBalance);
  const aiMode = useAiStore(s => s.aiMode);
  const files = useFileSystemStore(s => s.files);
  const activeFile = useFileSystemStore(s => s.activeFile);
  const shellMode = useLayoutStore(s => s.shellMode);
  const wcBooting = useLayoutStore(s => s.webContainerBooting);
  const isCollabActive = useCollabStore(s => s.isCollabActive);
  const connectedPeers = useCollabStore(s => s.connectedPeers);
  const gitCurrentBranch = useGitStore(s => s.gitState.currentBranch);
  const getChangedFileCount = useGitStore(s => s.getChangedFileCount);
  const gitChangedCount = getChangedFileCount();
  const pkgCount = usePackageStore(s => s.packages.length);
  const deployStatus = useDeployStore(s => s.deployStatus);
  const autoCtx = useAutonomousStore(s => s.ctx);
  const autoTask = useAutonomousStore(s => s.currentTask);

  // Derive language and warnCount
  const language = files[activeFile]?.language ?? "text";
  const warnCount = React.useMemo(() => logs.filter(l => l.level === "warn").length, [logs]);

  return (
    <div style={{
      height: 24, flexShrink: 0,
      background: "#f9fafb",
      borderTop: `1px solid ${T.border}`,
      display: "flex", alignItems: "center",
      padding: "0 10px", gap: 0,
      fontSize: 11, color: T.muted,
      userSelect: "none", zIndex: 20,
    }}>
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
        {/* Branch */}
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#5b9cf6" }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="3" r="2"/><circle cx="11" cy="13" r="2"/><circle cx="11" cy="6" r="2"/>
            <path d="M5 5v6M5 11c0 1.1.9 2 2 2h2"/>
          </svg>
          <span style={{ fontWeight: 600 }}>{gitCurrentBranch}</span>
          {gitChangedCount > 0 && (
            <span style={{ color: T.accent, fontWeight: 600, fontSize: 10 }}>
              +{gitChangedCount}
            </span>
          )}
        </span>

        {/* Errors */}
        <button
          onClick={onClickErrors}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            padding: "0 4px", borderRadius: 4, fontFamily: "inherit",
            fontSize: 11, color: T.muted, transition: "background 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            color: errorCount > 0 ? T.red : T.muted,
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8" cy="8" r="6"/><line x1="8" y1="5" x2="8" y2="9"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/>
            </svg>
            <span>{errorCount}</span>
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            color: warnCount > 0 ? T.warn : T.muted,
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2L14 13H2L8 2Z"/><line x1="8" y1="6" x2="8" y2="10"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/>
            </svg>
            <span>{warnCount}</span>
          </span>
        </button>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Collab peers indicator */}
        {isCollabActive && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.green }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="5" r="2.5"/><circle cx="10" cy="5" r="2.5"/><path d="M2 14c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"/>
            </svg>
            <span style={{ fontWeight: 600 }}>{connectedPeers}</span>
          </span>
        )}

        {/* Shell mode badge */}
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          background: shellMode === "webcontainer"
            ? "rgba(34,197,94,0.12)"
            : "#f3f4f6",
          border: `1px solid ${shellMode === "webcontainer" ? "rgba(34,197,94,0.3)" : T.border}`,
          borderRadius: 4, padding: "1px 7px",
          color: shellMode === "webcontainer" ? "#22c55e" : T.muted,
          fontWeight: 700, fontSize: 10, letterSpacing: "0.02em",
        }}>
          {wcBooting && (
            <div style={{
              width: 7, height: 7,
              border: "1.5px solid rgba(34,197,94,0.3)",
              borderTopColor: "#22c55e",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }} />
          )}
          {shellMode === "webcontainer" ? "WebContainer" : "Mock"}
        </span>

        {/* Autonomous agent progress */}
        {autoCtx.state !== "idle" && autoCtx.state !== "completed" && autoCtx.state !== "cancelled" && autoTask && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 4, padding: "1px 7px",
            color: T.accent, fontWeight: 700, fontSize: 10,
          }}>
            ⚡ Step {autoCtx.currentStepIndex + 1}/{autoCtx.totalSteps}
          </span>
        )}

        {/* Deploy status */}
        {deployStatus !== "idle" && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            background: deployStatus === "deployed" ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
            border: `1px solid ${deployStatus === "deployed" ? "rgba(34,197,94,0.3)" : "rgba(249,115,22,0.3)"}`,
            borderRadius: 4, padding: "1px 7px",
            color: deployStatus === "deployed" ? T.green : T.accent,
            fontWeight: 700, fontSize: 10,
          }}>
            {deployStatus === "deployed" ? "Deployed ✓" : deployStatus === "building" ? "Building..." : deployStatus === "uploading" ? "Uploading..." : "Detecting..."}
          </span>
        )}

        {/* Packages count */}
        {pkgCount > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.info }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.5L14 4.5V11.5L8 14.5L2 11.5V4.5L8 1.5Z"/>
            </svg>
            <span style={{ fontWeight: 600 }}>{pkgCount} deps</span>
          </span>
        )}

        {/* Language */}
        <span>{LANG_LABELS[language] ?? language}</span>

        {/* Cursor position */}
        <span>Ln {cursorLine}, Col {cursorCol}</span>

        {/* Token balance */}
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.accent }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 2L9.8 6.6H14.6L10.8 9.4L12.2 14L8 11.2L3.8 14L5.2 9.4L1.4 6.6H6.2L8 2Z"/>
          </svg>
          <span style={{ fontWeight: 600 }}>{tokenBalance.toLocaleString()}</span>
        </span>

        {/* AI model badge */}
        <span style={{
          background: "rgba(249,115,22,0.12)",
          border: `1px solid rgba(249,115,22,0.22)`,
          borderRadius: 4, padding: "1px 7px",
          color: T.accent, fontWeight: 700, fontSize: 10,
          letterSpacing: "0.02em",
        }}>
          {MODEL_LABELS[aiMode] ?? aiMode}
        </span>
      </div>
    </div>
  );
}
