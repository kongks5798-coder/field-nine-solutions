"use client";

import React, { useState, useMemo } from "react";
import { T, fileIcon, extToLang } from "./workspace.constants";
import type { FileNode } from "./workspace.constants";
import {
  useFileSystemStore,
  useUiStore,
} from "./stores";

export interface WorkspaceFileTreeProps {
  newFileRef: React.RefObject<HTMLInputElement | null>;
}

export function WorkspaceFileTree({
  newFileRef,
}: WorkspaceFileTreeProps) {
  // FileSystem store
  const files = useFileSystemStore(s => s.files);
  const activeFile = useFileSystemStore(s => s.activeFile);
  const changedFiles = useFileSystemStore(s => s.changedFiles);
  const showNewFile = useFileSystemStore(s => s.showNewFile);
  const setShowNewFile = useFileSystemStore(s => s.setShowNewFile);
  const newFileName = useFileSystemStore(s => s.newFileName);
  const setNewFileName = useFileSystemStore(s => s.setNewFileName);
  const openFile = useFileSystemStore(s => s.openFile);
  const createFile = useFileSystemStore(s => s.createFile);
  const importFiles = useFileSystemStore(s => s.importFiles);

  // UI store
  const setCtxMenu = useUiStore(s => s.setCtxMenu);
  const showToast = useUiStore(s => s.showToast);

  const sortedFiles = useMemo(() => Object.keys(files).sort(), [files]);

  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const imported: Record<string, FileNode> = {};
    const allowedExts = [".html", ".css", ".js", ".ts", ".json", ".md", ".txt", ".svg", ".xml"];
    const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"];

    for (const file of droppedFiles) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (allowedExts.includes(ext)) {
        const content = await file.text();
        const lang = extToLang(file.name);
        imported[file.name] = { name: file.name, language: lang, content };
      } else if (imageExts.includes(ext)) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imported[file.name] = {
          name: file.name,
          language: "html",
          content: `<!-- Image: ${file.name} -->\n<img src="${dataUrl}" alt="${file.name}" style="max-width:100%">`,
        };
      }
    }

    const count = Object.keys(imported).length;
    if (count > 0) {
      importFiles(imported);
      showToast(`\uD83D\uDCC1 ${count}개 파일 가져옴`);
    } else if (count === 0) {
      showToast("\u26A0\uFE0F 지원하지 않는 파일 형식입니다");
    }
  };

  const handleCreateFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    createFile(name);
  };

  return (
    <div
      role="tree"
      aria-label="파일 탐색기"
      style={{
        flex: 1, overflow: "auto", padding: "6px 0", position: "relative",
        border: dragOver ? `2px dashed ${T.accent}` : "2px dashed transparent",
        background: dragOver ? "rgba(249,115,22,0.06)" : "transparent",
        transition: "border 0.15s, background 0.15s",
      }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleDrop(e); }}
    >
      {/* Drop overlay */}
      {dragOver && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(249,115,22,0.10)",
          pointerEvents: "none",
        }}>
          <span style={{
            color: T.accent, fontSize: 12, fontWeight: 600,
            padding: "8px 16px", borderRadius: 8,
            background: "rgba(255,255,255,0.95)",
            border: `1px solid ${T.accent}`,
          }}>
            {"\uD83D\uDCC1"} 여기에 파일을 드롭하세요
          </span>
        </div>
      )}

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
          onMouseEnter={e => { if (activeFile !== name) e.currentTarget.style.background = "#f9fafb"; }}
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
              if (e.key === "Enter") handleCreateFile();
              if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
            }}
            placeholder="파일명.js"
            style={{
              flex: 1, background: "#f3f4f6", border: `1px solid ${T.borderHi}`,
              color: T.text, borderRadius: 5, padding: "4px 8px", fontSize: 11, outline: "none", fontFamily: "inherit",
            }}
          />
          <button onClick={handleCreateFile} aria-label="파일 생성 확인"
            style={{ background: T.accent, border: "none", borderRadius: 5, color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 11 }}>{"\u2713"}</button>
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
