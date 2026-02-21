"use client";

import React from "react";
import { T, logColor } from "./workspace.constants";
import type { LogEntry, LeftTab } from "./workspace.constants";
import { DragHandle } from "./DragHandle";

export interface ConsolePanelProps {
  logs: LogEntry[];
  errorCount: number;
  showConsole: boolean;
  consoleH: number;
  autoFixCountdown: number | null;
  setShowConsole: React.Dispatch<React.SetStateAction<boolean>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setErrorCount: React.Dispatch<React.SetStateAction<number>>;
  setAutoFixCountdown: React.Dispatch<React.SetStateAction<number | null>>;
  autoFixErrors: () => void;
  runAI: (prompt: string) => void;
  autoFixTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>;
  setLeftTab: React.Dispatch<React.SetStateAction<LeftTab>>;
  onDragStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function ConsolePanel({
  logs, errorCount, showConsole, consoleH, autoFixCountdown,
  setShowConsole, setLogs, setErrorCount, setAutoFixCountdown,
  autoFixErrors, runAI, autoFixTimerRef, setLeftTab,
  onDragStart, isDragging,
}: ConsolePanelProps) {
  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.topbar }}>
      <DragHandle direction="vertical" onMouseDown={onDragStart} isDragging={isDragging} />
      <div onClick={() => setShowConsole(v => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", cursor: "pointer" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3 3.5l1.5 1.5L3 6.5M6 6.5h1.5"/>
          </svg>
          콘솔
          {errorCount > 0 && (
            <span style={{ background: T.red, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{errorCount}</span>
          )}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {errorCount > 0 && (
            <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); } autoFixErrors(); }}
              style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              ✦ AI 자동 수정
              {autoFixCountdown !== null && (
                <span style={{ opacity: 0.75 }}>({autoFixCountdown}s)</span>
              )}
            </button>
          )}
          {autoFixCountdown !== null && (
            <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); }}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>취소</button>
          )}
          <button onClick={e => { e.stopPropagation(); setLogs([]); setErrorCount(0); }}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>지우기</button>
          <span style={{ color: T.muted, fontSize: 12 }}>{showConsole ? "▾" : "▴"}</span>
        </div>
      </div>
      {showConsole && (
        <div style={{ height: consoleH, overflowY: "auto", padding: "2px 12px 10px", fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 11, lineHeight: 1.75 }}>
          {logs.length === 0
            ? <div style={{ color: T.muted }}>콘솔 출력이 여기에 표시됩니다.</div>
            : logs.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: l.level === "error" ? `2px solid ${T.red}` : l.level === "warn" ? `2px solid ${T.warn}` : "2px solid transparent", paddingLeft: 6, marginBottom: 1 }}>
                <span style={{ color: T.muted, flexShrink: 0, fontSize: 9.5 }}>{l.ts}</span>
                <span style={{ color: logColor(l.level), flex: 1, wordBreak: "break-all" }}>{l.msg}</span>
                {l.level === "error" && (
                  <button onClick={e => { e.stopPropagation(); runAI(`다음 JS 에러를 찾아서 수정해줘 (에러 메시지를 기반으로 원인 파악 후 코드 수정):\n${l.msg}`); setLeftTab("ai"); }}
                    style={{ flexShrink: 0, padding: "1px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${T.red}22`, border: `1px solid ${T.red}44`, color: T.red, cursor: "pointer", fontFamily: "inherit" }}>
                    수정
                  </button>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
