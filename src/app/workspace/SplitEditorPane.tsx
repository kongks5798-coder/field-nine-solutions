"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { T } from "./workspace.constants";
import type { FilesMap } from "./workspace.constants";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface SplitEditorPaneProps {
  files: FilesMap;
  activeFile: string;
  splitFile: string;
  onFileChange: (filename: string, content: string) => void;
  onSetSplitFile: (filename: string) => void;
  onCloseSplit: () => void;
  openTabs: string[];
  isMobile: boolean;
}

const MONO_FONT = '"JetBrains Mono","Fira Code","Cascadia Code",monospace';

const EDITOR_OPTIONS = {
  fontSize: 13,
  fontFamily: MONO_FONT,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  lineNumbers: "on" as const,
  renderLineHighlight: "all" as const,
  automaticLayout: true,
  tabSize: 2,
  smoothScrolling: true,
  cursorBlinking: "smooth" as const,
  formatOnPaste: true,
  suggestOnTriggerCharacters: true,
  padding: { top: 10 },
};

function PanelLabel({ filename, right, files, onSetSplitFile, onCloseSplit }: {
  filename: string;
  right?: boolean;
  files: FilesMap;
  onSetSplitFile?: (f: string) => void;
  onCloseSplit?: () => void;
}) {
  const ext = filename.split(".").pop() ?? "";
  const iconColor: Record<string, string> = {
    html: "#e44d26", css: "#264de4", js: "#f0db4f", ts: "#3178c6",
    py: "#3572a5", json: "#adb5bd", md: "#7ee787",
  };
  const color = iconColor[ext] ?? T.muted;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 30, padding: "0 10px", background: T.topbar,
      borderBottom: `1px solid ${T.border}`, flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 8, color, fontWeight: 900 }}>&#x2B24;</span>
        {right && onSetSplitFile ? (
          <select
            aria-label="분할 파일 선택"
            value={filename}
            onChange={e => onSetSplitFile(e.target.value)}
            style={{
              background: "transparent", color: T.text, border: "none",
              fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              cursor: "pointer", outline: "none", maxWidth: 140,
            }}
          >
            {Object.keys(files).map(f => (
              <option key={f} value={f} style={{ background: T.panel, color: T.text }}>{f}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {filename}
          </span>
        )}
      </div>
      {right && onCloseSplit && (
        <button
          aria-label="분할 편집기 닫기"
          onClick={onCloseSplit}
          style={{
            background: "none", border: "none", color: T.muted, cursor: "pointer",
            fontSize: 14, lineHeight: 1, padding: "2px 4px", borderRadius: 3,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.red; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
        >
          &#x2715;
        </button>
      )}
    </div>
  );
}

export function SplitEditorPane({
  files, activeFile, splitFile, onFileChange,
  onSetSplitFile, onCloseSplit, openTabs, isMobile,
}: SplitEditorPaneProps) {
  const leftFile = files[activeFile] ?? null;
  const rightFile = files[splitFile] ?? null;

  const handleLeftChange = useCallback((v: string | undefined) => {
    onFileChange(activeFile, v ?? "");
  }, [activeFile, onFileChange]);

  const handleRightChange = useCallback((v: string | undefined) => {
    onFileChange(splitFile, v ?? "");
  }, [splitFile, onFileChange]);

  if (isMobile) return null;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <PanelLabel filename={activeFile} files={files} />
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {leftFile ? (
            <MonacoEditor
              height="100%"
              language={leftFile.language}
              theme="vs-dark"
              value={leftFile.content}
              onChange={handleLeftChange}
              options={EDITOR_OPTIONS}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>
              파일 없음
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 2, background: T.border, flexShrink: 0, cursor: "default" }} />

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <PanelLabel
          filename={splitFile}
          right
          files={files}
          onSetSplitFile={onSetSplitFile}
          onCloseSplit={onCloseSplit}
        />
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {rightFile ? (
            <MonacoEditor
              height="100%"
              language={rightFile.language}
              theme="vs-dark"
              value={rightFile.content}
              onChange={handleRightChange}
              options={EDITOR_OPTIONS}
            />
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>
              파일을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
