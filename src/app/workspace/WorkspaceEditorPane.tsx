"use client";

import React, { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { T } from "./workspace.constants";
import { ConsolePanel } from "./ConsolePanel";
import { DragHandle } from "./DragHandle";
import { SplitEditorPane } from "./SplitEditorPane";
import {
  useFileSystemStore,
  useEditorStore,
  useLayoutStore,
  usePreviewStore,
  useAiStore,
  useCollabStore,
} from "./stores";
import { computeDecorations, applyMonacoDecorations, DIFF_DECORATION_CSS } from "./ai/diffDecorations";
import { getCollabSession } from "./collab/collabSessionHolder";
import { bindMonacoToYjs } from "./collab/MonacoBinding";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const TerminalPanel = dynamic(() => import("./TerminalPanel"), { ssr: false });

export interface WorkspaceEditorPaneProps {
  autoFixTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>;
  autoFixErrors: () => void;
  runAI: (prompt: string) => void;
  startDragConsole: (e: React.MouseEvent) => void;
  onToggleSplit: () => void;
  onSplitFileChange: (filename: string, content: string) => void;
  onRunProject?: () => void;
}

export function WorkspaceEditorPane({
  autoFixTimerRef,
  autoFixErrors, runAI, startDragConsole,
  onToggleSplit, onSplitFileChange, onRunProject,
}: WorkspaceEditorPaneProps) {
  // FileSystem store
  const files = useFileSystemStore(s => s.files);
  const activeFile = useFileSystemStore(s => s.activeFile);
  const openTabs = useFileSystemStore(s => s.openTabs);
  const changedFiles = useFileSystemStore(s => s.changedFiles);
  const setActiveFile = useFileSystemStore(s => s.setActiveFile);
  const closeTab = useFileSystemStore(s => s.closeTab);
  const setShowNewFile = useFileSystemStore(s => s.setShowNewFile);
  const updateFileContent = useFileSystemStore(s => s.updateFileContent);

  // Editor store
  const monacoLoaded = useEditorStore(s => s.monacoLoaded);
  const setMonacoLoaded = useEditorStore(s => s.setMonacoLoaded);
  const splitMode = useEditorStore(s => s.splitMode);
  const splitFile = useEditorStore(s => s.splitFile);
  const setSplitFile = useEditorStore(s => s.setSplitFile);
  const setCursorLine = useEditorStore(s => s.setCursorLine);
  const setCursorCol = useEditorStore(s => s.setCursorCol);

  // Layout store
  const isMobile = useLayoutStore(s => s.isMobile);
  const showConsole = useLayoutStore(s => s.showConsole);
  const consoleH = useLayoutStore(s => s.consoleH);
  const draggingConsole = useLayoutStore(s => s.draggingConsole);
  const bottomTab = useLayoutStore(s => s.bottomTab);
  const setBottomTab = useLayoutStore(s => s.setBottomTab);
  const setShowConsole = useLayoutStore(s => s.setShowConsole);
  const terminalH = useLayoutStore(s => s.terminalH);

  // Collab store
  const isCollabActive = useCollabStore(s => s.isCollabActive);

  const currentFile = files[activeFile] ?? null;
  const editorRef = useRef<any>(null);
  const prevContentRef = useRef<string>("");
  const decorationIdsRef = useRef<string[]>([]);
  const collabBindingRef = useRef<{ destroy: () => void } | null>(null);
  const collabBoundFileRef = useRef<string>("");

  const formatCode = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, []);

  // Alt+Shift+F keyboard shortcut for formatting
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        formatCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [formatCode]);

  // ── Diff decorations: highlight changes after AI patching ──────────────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !changedFiles.includes(activeFile)) return;
    const newContent = currentFile?.content ?? "";
    const oldContent = prevContentRef.current;
    if (!oldContent || oldContent === newContent) return;
    const decs = computeDecorations(oldContent, newContent);
    if (decs.length === 0) return;
    decorationIdsRef.current = applyMonacoDecorations(editor, decs);
    // Auto-clear decorations after 5 seconds
    const timer = setTimeout(() => {
      if (editorRef.current) {
        decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, []);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [changedFiles, activeFile, currentFile?.content]);

  // Track previous content for diff computation
  useEffect(() => {
    prevContentRef.current = currentFile?.content ?? "";
  }, [activeFile]);

  // Inject diff decoration CSS once
  useEffect(() => {
    const id = "diff-decoration-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = DIFF_DECORATION_CSS;
    document.head.appendChild(style);
  }, []);

  // ── Collab binding: connect Monaco to Yjs when collab is active ──────────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !isCollabActive) {
      // If collab just deactivated, destroy existing binding
      if (collabBindingRef.current) {
        collabBindingRef.current.destroy();
        collabBindingRef.current = null;
        collabBoundFileRef.current = "";
      }
      return;
    }

    const session = getCollabSession();
    if (!session) return;

    // If we're already bound to this file, skip
    if (collabBoundFileRef.current === activeFile && collabBindingRef.current) return;

    // Destroy previous binding (file switch)
    if (collabBindingRef.current) {
      collabBindingRef.current.destroy();
      collabBindingRef.current = null;
    }

    const yText = session.doc.getText(activeFile);

    // Initialize yText with current content if empty
    if (yText.length === 0 && currentFile?.content) {
      yText.insert(0, currentFile.content);
    }

    // Async bind
    bindMonacoToYjs(editor, yText, session.awareness)
      .then(binding => {
        collabBindingRef.current = binding;
        collabBoundFileRef.current = activeFile;
      })
      .catch(err => {
        console.error("Failed to bind Monaco to Yjs:", err);
      });

    return () => {
      // Cleanup on unmount or dependency change
      if (collabBindingRef.current) {
        collabBindingRef.current.destroy();
        collabBindingRef.current = null;
        collabBoundFileRef.current = "";
      }
    };
  }, [isCollabActive, activeFile, monacoLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseTab = useCallback((name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(name);
  }, [closeTab]);

  const handleUpdateContent = useCallback((content: string) => {
    updateFileContent(activeFile, content);
  }, [updateFileContent, activeFile]);

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
              <span style={{ fontSize: 9, color, fontWeight: 900, lineHeight: 1 }}>{"\u2B24"}</span>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              {changedFiles.includes(name) && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.accent, flexShrink: 0 }}/>
              )}
              <span role="button" aria-label={`${name} 탭 닫기`} onClick={e => handleCloseTab(name, e)}
                style={{ fontSize: 13, color: "transparent", lineHeight: 1, padding: "1px 3px", borderRadius: 3, cursor: "pointer", transition: "all 0.1s", marginLeft: 2 }}
                onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = "rgba(248,113,113,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "transparent"; e.currentTarget.style.background = "transparent"; }}>{"\u00D7"}</span>
            </div>
          );
        })}
        <button onClick={() => setShowNewFile(true)} aria-label="새 파일 만들기"
          style={{ padding: "0 14px", height: 36, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          title="새 파일 (Ctrl+K \u2192 새 파일)">+</button>
        {/* Spacer to push buttons to right */}
        <div style={{ flex: 1 }} />
        {/* Format button -- desktop only */}
        {!isMobile && (
          <button
            onClick={formatCode}
            aria-label="코드 정리"
            title="코드 정리 (Alt+Shift+F)"
            style={{
              padding: "0 10px", height: 36, background: "none", border: "none",
              color: T.muted, cursor: "pointer",
              fontSize: 12, lineHeight: 1, flexShrink: 0, fontWeight: 700,
              fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
          >
            {"{ }"}
          </button>
        )}
        {/* Split editor toggle -- desktop only */}
        {!isMobile && (
          <button
            onClick={onToggleSplit}
            aria-label={splitMode ? "분할 편집기 닫기" : "분할 편집기 열기"}
            title={splitMode ? "분할 닫기 (Ctrl+\\)" : "분할 열기 (Ctrl+\\)"}
            style={{
              padding: "0 10px", height: 36, background: "none", border: "none",
              color: splitMode ? T.accent : T.muted, cursor: "pointer",
              fontSize: 15, lineHeight: 1, flexShrink: 0, fontWeight: 700,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { if (!splitMode) e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { if (!splitMode) e.currentTarget.style.color = T.muted; }}
          >
            &#x2759;&#x2759;
          </button>
        )}
      </div>

      {/* Editor area -- split or single */}
      {splitMode && !isMobile ? (
        <SplitEditorPane
          files={files}
          activeFile={activeFile}
          splitFile={splitFile}
          onFileChange={onSplitFileChange}
          onSetSplitFile={setSplitFile}
          onCloseSplit={onToggleSplit}
          openTabs={openTabs}
          isMobile={isMobile}
        />
      ) : (
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {currentFile ? (
            <>
              {/* Textarea: immediately functional while Monaco loads; permanent on mobile */}
              {(!monacoLoaded || isMobile) && (
                <textarea
                  aria-label={`${activeFile} 코드 편집`}
                  value={currentFile.content}
                  onChange={e => handleUpdateContent(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const s = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const val = e.currentTarget.value;
                      const next = val.substring(0, s) + "  " + val.substring(end);
                      e.currentTarget.value = next;
                      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2;
                      handleUpdateContent(next);
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
                    onChange={v => handleUpdateContent(v ?? "")}
                    onMount={(editor) => {
                      editorRef.current = editor;
                      setMonacoLoaded(true);
                      editor.onDidChangeCursorPosition((e: { position: { lineNumber: number; column: number } }) => {
                        setCursorLine(e.position.lineNumber);
                        setCursorCol(e.position.column);
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
              <div style={{ fontSize: 32 }}>&#x1F4C4;</div>
              <div style={{ fontSize: 13 }}>파일을 선택하거나 새로 만드세요</div>
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Panel: Console / Terminal tabs ───────────────────────────── */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.topbar }}>
        {/* Drag handle for bottom panel resize */}
        <DragHandle direction="vertical" onMouseDown={startDragConsole} isDragging={draggingConsole} />

        {/* Tab bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 0,
          borderBottom: showConsole ? `1px solid ${T.border}` : "none",
        }}>
          {/* Console tab */}
          <button
            onClick={() => { setBottomTab("console"); setShowConsole(true); }}
            style={{
              padding: "5px 14px", fontSize: 11, fontWeight: 600,
              background: "transparent", border: "none", cursor: "pointer",
              color: bottomTab === "console" ? T.accent : T.muted,
              borderBottom: bottomTab === "console" && showConsole ? `2px solid ${T.accent}` : "2px solid transparent",
              fontFamily: "inherit", transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3 3.5l1.5 1.5L3 6.5M6 6.5h1.5"/>
            </svg>
            Console
          </button>

          {/* Terminal tab */}
          <button
            onClick={() => { setBottomTab("terminal"); setShowConsole(true); }}
            style={{
              padding: "5px 14px", fontSize: 11, fontWeight: 600,
              background: "transparent", border: "none", cursor: "pointer",
              color: bottomTab === "terminal" ? T.accent : T.muted,
              borderBottom: bottomTab === "terminal" && showConsole ? `2px solid ${T.accent}` : "2px solid transparent",
              fontFamily: "inherit", transition: "all 0.12s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l4-4-4-4"/><path d="M8 12h4"/>
            </svg>
            Terminal
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Toggle collapse */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            style={{
              background: "none", border: "none", color: T.muted,
              cursor: "pointer", fontSize: 12, padding: "5px 10px",
              fontFamily: "inherit",
            }}
          >
            {showConsole ? "\u25BE" : "\u25B4"}
          </button>
        </div>

        {/* Panel content */}
        {showConsole && (
          <div style={{ height: bottomTab === "terminal" ? terminalH : undefined }}>
            {/* Console panel — visible when console tab active */}
            <div style={{ display: bottomTab === "console" ? "block" : "none" }}>
              <ConsolePanel
                autoFixErrors={autoFixErrors}
                runAI={runAI}
                autoFixTimerRef={autoFixTimerRef}
                onDragStart={startDragConsole}
                embedded
              />
            </div>

            {/* Terminal panel — visible when terminal tab active */}
            <div style={{
              display: bottomTab === "terminal" ? "block" : "none",
              height: terminalH,
              overflow: "hidden",
            }}>
              <TerminalPanel
                onRunProject={onRunProject}
                onRunAI={runAI}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
