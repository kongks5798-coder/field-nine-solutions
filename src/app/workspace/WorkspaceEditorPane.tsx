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
  onCursorChange?: (line: number, col: number) => void;
}

export function WorkspaceEditorPane({
  isMobile, openTabs, files, activeFile, changedFiles,
  monacoLoaded, showConsole, consoleH, autoFixCountdown,
  logs, errorCount, draggingConsole, autoFixTimerRef,
  setActiveFile, closeTab, setShowNewFile, setMonacoLoaded,
  updateFileContent, setShowConsole, setLogs, setErrorCount,
  setAutoFixCountdown, setLeftTab, autoFixErrors, runAI, startDragConsole,
  onCursorChange,
}: WorkspaceEditorPaneProps) {
  const currentFile = files[activeFile] ?? null;

  return (
    <div role="tabpanel" aria-label="코드 편집기" style={{ flex: 1, display: isMobile ? "none" : "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      {/* File tabs */}
      <div role="tablist" aria-label="열린 파일 탭" style={{ display: "flex", alignItems: "center", background: T.topbar, borderBottom: `1px solid ${T.border}`, flexShrink: 0, overflowX: "auto" }}>
        {openTabs.filter(t => files[t]).map(name => {
          const ext = name.split(".").pop() ?? "";
          const iconColor: Record<string, string> = {
            html: "#e44d26", css: "#264de4", js: "#f0db4f", ts: "#3178c6",
            py: "#3572a5", json: "#adb5bd", md: "#7ee787",
          };
          const color = iconColor[ext] ?? T.muted;
          const isActive = activeFile === name;
          return (
            <div key={name} role="tab" aria-selected={isActive} aria-label={`파일: ${name}`} onClick={() => setActiveFile(name)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 14px", height: 36, cursor: "pointer", flexShrink: 0,
                borderRight: `1px solid ${T.border}`,
                background: isActive ? T.panel : "transparent",
                borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                color: isActive ? T.text : T.muted,
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                transition: "all 0.1s", position: "relative",
              }}>
              <span style={{ fontSize: 9, color, fontWeight: 900, lineHeight: 1 }}>⬤</span>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              {changedFiles.includes(name) && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, flexShrink: 0 }}/>
              )}
              <span role="button" aria-label={`${name} 탭 닫기`} onClick={e => closeTab(name, e)}
                style={{ fontSize: 13, color: "transparent", lineHeight: 1, padding: "1px 3px", borderRadius: 3, cursor: "pointer", transition: "all 0.1s", marginLeft: 2 }}
                onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = "rgba(248,113,113,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "transparent"; e.currentTarget.style.background = "transparent"; }}>×</span>
            </div>
          );
        })}
        <button onClick={() => setShowNewFile(true)} aria-label="새 파일 만들기"
          style={{ padding: "0 14px", height: 36, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          title="새 파일 (Ctrl+K → 새 파일)">+</button>
      </div>

      {/* Monaco + Textarea fallback */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {currentFile ? (
          <>
            {/* Textarea: immediately functional while Monaco loads; permanent on mobile */}
            {(!monacoLoaded || isMobile) && (
              <textarea
                aria-label={`${activeFile} 코드 편집`}
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
                  onMount={(editor) => {
                    setMonacoLoaded(true);
                    editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
                      onCursorChange?.(e.position.lineNumber, e.position.column);
                    });
                  }}
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
