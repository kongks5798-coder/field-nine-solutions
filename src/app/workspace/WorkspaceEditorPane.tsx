"use client";

import React from "react";
import dynamic from "next/dynamic";
import { T, fileIcon } from "./workspace.constants";
import type { FilesMap, LogEntry, LeftTab } from "./workspace.constants";
import { ConsolePanel } from "./ConsolePanel";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface WorkspaceEditorPaneProps {
  isMobile: boolean;
  openTabs: string[];
  files: FilesMap;
  activeFile: string;
  changedFiles: string[];
  monacoLoaded: boolean;
  showConsole: boolean;
  consoleH: number;
  autoFixCountdown: number | null;
  logs: LogEntry[];
  errorCount: number;
  draggingConsole: boolean;
  autoFixTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>;
  setActiveFile: React.Dispatch<React.SetStateAction<string>>;
  closeTab: (name: string, e: React.MouseEvent) => void;
  setShowNewFile: React.Dispatch<React.SetStateAction<boolean>>;
  setMonacoLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  updateFileContent: (content: string) => void;
  setShowConsole: React.Dispatch<React.SetStateAction<boolean>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setErrorCount: React.Dispatch<React.SetStateAction<number>>;
  setAutoFixCountdown: React.Dispatch<React.SetStateAction<number | null>>;
  setLeftTab: React.Dispatch<React.SetStateAction<LeftTab>>;
  autoFixErrors: () => void;
  runAI: (prompt: string) => void;
  startDragConsole: (e: React.MouseEvent) => void;
}

export function WorkspaceEditorPane({
  isMobile, openTabs, files, activeFile, changedFiles,
  monacoLoaded, showConsole, consoleH, autoFixCountdown,
  logs, errorCount, draggingConsole, autoFixTimerRef,
  setActiveFile, closeTab, setShowNewFile, setMonacoLoaded,
  updateFileContent, setShowConsole, setLogs, setErrorCount,
  setAutoFixCountdown, setLeftTab, autoFixErrors, runAI, startDragConsole,
}: WorkspaceEditorPaneProps) {
  const currentFile = files[activeFile] ?? null;

  return (
    <div style={{ flex: 1, display: isMobile ? "none" : "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* File tabs */}
      <div style={{ display: "flex", alignItems: "center", background: T.topbar, borderBottom: `1px solid ${T.border}`, flexShrink: 0, overflowX: "auto" }}>
        {openTabs.filter(t => files[t]).map(name => (
          <div key={name} onClick={() => setActiveFile(name)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", cursor: "pointer", flexShrink: 0,
              borderRight: `1px solid ${T.border}`,
              background: activeFile === name ? T.panel : "transparent",
              borderBottom: activeFile === name ? `2px solid ${T.accent}` : "2px solid transparent",
              color: activeFile === name ? T.text : T.muted,
              fontSize: 12, fontWeight: activeFile === name ? 600 : 400,
              transition: "all 0.1s", position: "relative",
            }}>
            <span style={{ fontSize: 11 }}>{fileIcon(name)}</span>
            <span>{name}</span>
            {changedFiles.includes(name) && (
              <span style={{ position: "absolute", top: 7, right: 20, width: 5, height: 5, borderRadius: "50%", background: T.accent }}/>
            )}
            <span onClick={e => closeTab(name, e)}
              style={{ fontSize: 14, color: T.muted, lineHeight: 1, padding: "0 2px", borderRadius: 3, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.color = T.red)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}>×</span>
          </div>
        ))}
        <button onClick={() => setShowNewFile(true)}
          style={{ padding: "8px 12px", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          title="새 파일">+</button>
      </div>

      {/* Monaco + Textarea fallback */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {currentFile ? (
          <>
            {/* Textarea: immediately functional while Monaco loads; permanent on mobile */}
            {(!monacoLoaded || isMobile) && (
              <textarea
                value={currentFile.content}
                onChange={e => updateFileContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const s = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const val = e.currentTarget.value;
                    const next = val.substring(0, s) + "  " + val.substring(end);
                    e.currentTarget.value = next;
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2;
                    updateFileContent(next);
                  }
                }}
                spellCheck={false}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  background: "#1e1e1e", color: "#d4d8e2",
                  fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                  fontSize: 13, lineHeight: 1.6, padding: "10px 14px",
                  border: "none", outline: "none", resize: "none",
                  tabSize: 2, zIndex: 2, boxSizing: "border-box",
                }}
              />
            )}
            {/* Monaco loads in background, fades in when ready; skipped on mobile */}
            {!isMobile && (
              <div style={{ position: "absolute", inset: 0, opacity: monacoLoaded ? 1 : 0, transition: "opacity 0.2s" }}>
                <MonacoEditor
                  height="100%"
                  language={currentFile.language}
                  theme="vs-dark"
                  value={currentFile.content}
                  onChange={v => updateFileContent(v ?? "")}
                  onMount={() => setMonacoLoaded(true)}
                  options={{
                    fontSize: 13,
                    fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    automaticLayout: true,
                    tabSize: 2,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true,
                    padding: { top: 10 },
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: T.muted }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <div style={{ fontSize: 13 }}>파일을 선택하거나 새로 만드세요</div>
          </div>
        )}
      </div>

      {/* Console */}
      <ConsolePanel
        logs={logs}
        errorCount={errorCount}
        showConsole={showConsole}
        consoleH={consoleH}
        autoFixCountdown={autoFixCountdown}
        setShowConsole={setShowConsole}
        setLogs={setLogs}
        setErrorCount={setErrorCount}
        setAutoFixCountdown={setAutoFixCountdown}
        autoFixErrors={autoFixErrors}
        runAI={runAI}
        autoFixTimerRef={autoFixTimerRef}
        setLeftTab={setLeftTab}
        onDragStart={startDragConsole}
        isDragging={draggingConsole}
      />
    </div>
  );
}
