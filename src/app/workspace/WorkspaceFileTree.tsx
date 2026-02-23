"use client";

import React from "react";
import { T, fileIcon } from "./workspace.constants";

export interface WorkspaceFileTreeProps {
  sortedFiles: string[];
  activeFile: string;
  changedFiles: string[];
  showNewFile: boolean;
  setShowNewFile: (v: boolean) => void;
  newFileName: string;
  setNewFileName: (v: string) => void;
  newFileRef: React.RefObject<HTMLInputElement | null>;
  openFile: (name: string) => void;
  setCtxMenu: (menu: { x: number; y: number; file: string } | null) => void;
  createFile: () => void;
}

export function WorkspaceFileTree({
  sortedFiles, activeFile, changedFiles,
  showNewFile, setShowNewFile,
  newFileName, setNewFileName, newFileRef,
  openFile, setCtxMenu, createFile,
}: WorkspaceFileTreeProps) {
  return (
    <div role="tree" aria-label="파일 탐색기" style={{ flex: 1, overflow: "auto", padding: "6px 0" }}>
      {sortedFiles.map(name => (
        <div key={name} role="treeitem" aria-selected={activeFile === name} onClick={() => openFile(name)}
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, file: name }); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "5px 14px", cursor: "pointer", fontSize: 12,
            fontWeight: activeFile === name ? 600 : 400,
            color: activeFile === name ? T.text : T.muted,
            background: activeFile === name ? "rgba(249,115,22,0.08)" : "transparent",
            borderLeft: activeFile === name ? `2px solid ${T.accent}` : "2px solid transparent",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => { if (activeFile !== name) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          onMouseLeave={e => { if (activeFile !== name) e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 13 }}>{fileIcon(name)}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          {changedFiles.includes(name) && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
          )}
        </div>
      ))}
      {showNewFile ? (
        <div style={{ padding: "6px 12px", display: "flex", gap: 4 }}>
          <input ref={newFileRef as React.RefObject<HTMLInputElement>} aria-label="새 파일 이름" value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") createFile();
              if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
            }}
            placeholder="파일명.js"
            style={{
              flex: 1, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.borderHi}`,
              color: T.text, borderRadius: 5, padding: "4px 8px", fontSize: 11, outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={createFile} aria-label="파일 생성 확인"
            style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>✓</button>
        </div>
      ) : (
        <button onClick={() => setShowNewFile(true)} aria-label="새 파일 만들기"
          style={{
            margin: "6px 12px", padding: "5px 10px", borderRadius: 7,
            border: `1px dashed ${T.border}`, background: "none", color: T.muted,
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
            width: "calc(100% - 24px)", display: "flex", alignItems: "center", gap: 5,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        ><span style={{ fontSize: 14 }}>+</span> 새 파일</button>
      )}
    </div>
  );
}
