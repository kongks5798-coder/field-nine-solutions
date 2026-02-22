"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { T } from "./workspace.constants";
import type { FilesMap, LeftTab, LogEntry } from "./workspace.constants";

type CommandItem = {
  type: "file" | "command";
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
};

interface Props {
  open: boolean;
  onClose: () => void;
  files: FilesMap;
  openFile: (name: string) => void;
  runProject: () => void;
  publishProject: () => void;
  setLeftTab: React.Dispatch<React.SetStateAction<LeftTab>>;
  setShowNewFile: React.Dispatch<React.SetStateAction<boolean>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setErrorCount: React.Dispatch<React.SetStateAction<number>>;
  setAiMode: React.Dispatch<React.SetStateAction<string>>;
  aiMode: string;
  router: { push: (url: string) => void };
}

function fileTypeIcon(name: string) {
  if (name.endsWith(".html")) return <span style={{ color: "#e44d26" }}>⬡</span>;
  if (name.endsWith(".css"))  return <span style={{ color: "#264de4" }}>⬡</span>;
  if (name.endsWith(".js"))   return <span style={{ color: "#f7df1e" }}>⬡</span>;
  if (name.endsWith(".ts"))   return <span style={{ color: "#3178c6" }}>⬡</span>;
  if (name.endsWith(".py"))   return <span style={{ color: "#3572a5" }}>⬡</span>;
  if (name.endsWith(".json")) return <span style={{ color: "#aaa" }}>⬡</span>;
  return <span style={{ color: T.muted }}>⬡</span>;
}

export function CommandPalette({
  open, onClose, files, openFile, runProject, publishProject,
  setLeftTab, setShowNewFile, setLogs, setErrorCount, setAiMode, aiMode, router,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fileItems: CommandItem[] = Object.keys(files).sort().map(name => ({
    type: "file",
    icon: fileTypeIcon(name),
    label: name,
    description: "파일 열기",
    action: () => { openFile(name); onClose(); },
  }));

  const commandItems: CommandItem[] = [
    {
      type: "command", icon: "▶", label: "실행 (Ctrl+Enter)", description: "미리보기 새로고침",
      action: () => { runProject(); onClose(); },
    },
    {
      type: "command", icon: "🚀", label: "배포", description: "앱 배포 및 공개 URL 생성",
      action: () => { publishProject(); onClose(); },
    },
    {
      type: "command", icon: "📄", label: "새 파일 만들기", description: "파일 생성",
      action: () => { setShowNewFile(true); setLeftTab("files"); onClose(); },
    },
    {
      type: "command", icon: "🗑", label: "콘솔 지우기", description: "로그 및 에러 초기화",
      action: () => { setLogs([]); setErrorCount(0); onClose(); },
    },
    {
      type: "command", icon: "📁", label: "파일 탐색기", description: "파일 패널 열기",
      action: () => { setLeftTab("files"); onClose(); },
    },
    {
      type: "command", icon: "✦", label: "AI 채팅", description: "AI 패널 열기",
      action: () => { setLeftTab("ai"); onClose(); },
    },
    {
      type: "command", icon: "⚙", label: "설정", description: "API 키 관리",
      action: () => { router.push("/settings"); onClose(); },
    },
    ...(["openai", "anthropic", "gemini", "grok"] as const).map(m => ({
      type: "command" as const,
      icon: <span style={{ color: aiMode === m ? T.accent : T.muted }}>{aiMode === m ? "●" : "○"}</span>,
      label: `모델: ${m === "openai" ? "GPT-4o" : m === "anthropic" ? "Claude 3.5" : m === "gemini" ? "Gemini 1.5" : "Grok"}`,
      description: "AI 모델 전환",
      action: () => { setAiMode(m); onClose(); },
    })),
  ];

  const allItems = [...fileItems, ...commandItems];

  const filtered = query.trim()
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const filteredFiles = filtered.filter(i => i.type === "file");
  const filteredCmds  = filtered.filter(i => i.type === "command");

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActiveIdx(0), [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); filtered[activeIdx]?.action(); }
  }, [filtered, activeIdx, onClose]);

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 500,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
        style={{
          width: "min(620px, 92vw)",
          background: T.surface,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 14,
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(249,115,22,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", padding: "12px 16px",
          borderBottom: `1px solid ${T.border}`, gap: 10,
          background: "rgba(255,255,255,0.02)",
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={T.muted} strokeWidth="1.6" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5L14 14"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="파일 이름 또는 명령어 검색..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: T.text, fontSize: 14, fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 10, color: T.muted,
            background: "rgba(255,255,255,0.07)",
            padding: "2px 7px", borderRadius: 5,
            border: `1px solid ${T.border}`,
            fontFamily: "inherit",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 380, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: T.muted, fontSize: 13 }}>
              결과 없음
            </div>
          ) : (
            <>
              {/* Files group */}
              {filteredFiles.length > 0 && (
                <>
                  <div style={{
                    padding: "8px 16px 4px", fontSize: 10, color: T.muted,
                    fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>파일</div>
                  {filteredFiles.map(item => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <div
                        key={item.label}
                        data-idx={idx}
                        onClick={item.action}
                        onMouseEnter={() => setActiveIdx(idx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "7px 16px", cursor: "pointer",
                          background: activeIdx === idx ? "rgba(249,115,22,0.08)" : "transparent",
                          borderLeft: activeIdx === idx ? `2px solid ${T.accent}` : "2px solid transparent",
                          transition: "all 0.08s",
                        }}
                      >
                        <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{item.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, color: activeIdx === idx ? T.accent : T.text, fontWeight: activeIdx === idx ? 600 : 400 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 11, color: T.muted }}>{item.description}</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Commands group */}
              {filteredCmds.length > 0 && (
                <>
                  <div style={{
                    padding: "8px 16px 4px", fontSize: 10, color: T.muted,
                    fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    borderTop: filteredFiles.length > 0 ? `1px solid ${T.border}` : "none",
                    marginTop: filteredFiles.length > 0 ? 4 : 0,
                  }}>명령어</div>
                  {filteredCmds.map(item => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <div
                        key={`cmd-${idx}`}
                        data-idx={idx}
                        onClick={item.action}
                        onMouseEnter={() => setActiveIdx(idx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "7px 16px", cursor: "pointer",
                          background: activeIdx === idx ? "rgba(249,115,22,0.08)" : "transparent",
                          borderLeft: activeIdx === idx ? `2px solid ${T.accent}` : "2px solid transparent",
                          transition: "all 0.08s",
                        }}
                      >
                        <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{item.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, color: activeIdx === idx ? T.accent : T.text, fontWeight: activeIdx === idx ? 600 : 400 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: 11, color: T.muted }}>{item.description}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
          {/* Bottom padding */}
          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
}
