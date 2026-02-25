"use client";

import React, { useState, useMemo } from "react";
import { T, logColor } from "./workspace.constants";
import type { LogLevel } from "./workspace.constants";
import { DragHandle } from "./DragHandle";
import {
  usePreviewStore,
  useLayoutStore,
  useAiStore,
} from "./stores";

type LogFilter = "all" | LogLevel;

const FILTER_BUTTONS: { filter: LogFilter; icon: string; label: string }[] = [
  { filter: "all",   icon: "\uD83D\uDCCB", label: "\uC804\uCCB4" },
  { filter: "info",  icon: "\u2139\uFE0F",  label: "info" },
  { filter: "warn",  icon: "\u26A0\uFE0F",  label: "warn" },
  { filter: "error", icon: "\u274C", label: "error" },
];

export interface ConsolePanelProps {
  autoFixErrors: () => void;
  runAI: (prompt: string) => void;
  autoFixTimerRef: React.RefObject<ReturnType<typeof setInterval> | null>;
  onDragStart: (e: React.MouseEvent) => void;
  /** When true, skip outer wrapper (border, drag handle, header) — used inside tabbed bottom panel. */
  embedded?: boolean;
}

export function ConsolePanel({
  autoFixErrors, runAI, autoFixTimerRef,
  onDragStart, embedded,
}: ConsolePanelProps) {
  // Preview store
  const logs = usePreviewStore(s => s.logs);
  const errorCount = usePreviewStore(s => s.errorCount);
  const setLogs = usePreviewStore(s => s.setLogs);
  const setErrorCount = usePreviewStore(s => s.setErrorCount);
  const clearLogs = usePreviewStore(s => s.clearLogs);

  // Layout store
  const showConsole = useLayoutStore(s => s.showConsole);
  const setShowConsole = useLayoutStore(s => s.setShowConsole);
  const consoleH = useLayoutStore(s => s.consoleH);
  const draggingConsole = useLayoutStore(s => s.draggingConsole);
  const setLeftTab = useLayoutStore(s => s.setLeftTab);

  // AI store
  const autoFixCountdown = useAiStore(s => s.autoFixCountdown);
  const setAutoFixCountdown = useAiStore(s => s.setAutoFixCountdown);

  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Count by level
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { log: 0, info: 0, warn: 0, error: 0 };
    for (const l of logs) counts[l.level] = (counts[l.level] ?? 0) + 1;
    return counts;
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (logFilter !== "all") {
      if (logFilter === "info") {
        result = result.filter(l => l.level === "info" || l.level === "log");
      } else {
        result = result.filter(l => l.level === logFilter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => l.msg.toLowerCase().includes(q));
    }
    return result;
  }, [logs, logFilter, searchQuery]);

  // ── Embedded mode: just filter bar + logs, no outer wrapper/header ──────────
  const consoleContent = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Toolbar: filter + AI auto-fix + clear */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 12px", borderBottom: `1px solid ${T.border}`,
          background: "#fafafa",
        }}
      >
        {/* Level filter buttons */}
        {FILTER_BUTTONS.map(fb => {
          const isActive = logFilter === fb.filter;
          const count = fb.filter === "all"
            ? logs.length
            : fb.filter === "info"
              ? (levelCounts.info ?? 0) + (levelCounts.log ?? 0)
              : (levelCounts[fb.filter] ?? 0);
          return (
            <button
              key={fb.filter}
              onClick={() => setLogFilter(fb.filter)}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                border: `1px solid ${isActive ? T.borderHi : T.border}`,
                background: isActive ? `${T.accent}18` : "transparent",
                color: isActive ? T.accent : T.muted,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.1s",
              }}
            >
              <span style={{ fontSize: 10 }}>{fb.icon}</span>
              <span>{fb.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "0 4px", borderRadius: 8,
                  background: isActive ? `${T.accent}30` : "#e5e7eb",
                  color: isActive ? T.accent : T.muted,
                  minWidth: 14, textAlign: "center",
                }}>{count}</span>
              )}
            </button>
          );
        })}

        {/* Search input */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", marginLeft: 8 }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder={"\uB85C\uADF8 \uAC80\uC0C9..."}
            style={{
              width: "100%", background: "#f3f4f6",
              border: `1px solid ${T.border}`, borderRadius: 5,
              padding: "3px 8px", fontSize: 10, color: T.text,
              outline: "none", fontFamily: "inherit",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "none", border: "none", color: T.muted,
                cursor: "pointer", fontSize: 10, marginLeft: -22, padding: "0 4px",
              }}
            >{"\u2715"}</button>
          )}
        </div>

        {/* Filtered count indicator */}
        {(logFilter !== "all" || searchQuery) && (
          <span style={{ fontSize: 9, color: T.muted, flexShrink: 0 }}>
            {filteredLogs.length}/{logs.length}
          </span>
        )}

        {/* AI auto-fix button (moved here from header for embedded mode) */}
        {errorCount > 0 && (
          <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); } autoFixErrors(); }}
            style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {"\u2726"} AI {"\uC790\uB3D9 \uC218\uC815"}
            {autoFixCountdown !== null && (
              <span style={{ opacity: 0.75 }}>({autoFixCountdown}s)</span>
            )}
          </button>
        )}
        {autoFixCountdown !== null && (
          <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); }}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit", flexShrink: 0 }}>{"\uCDE8\uC18C"}</button>
        )}
        <button onClick={e => { e.stopPropagation(); clearLogs(); }}
          style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, fontFamily: "inherit", flexShrink: 0 }}>{"\uC9C0\uC6B0\uAE30"}</button>
      </div>

      {/* Log entries */}
      <div style={{ height: consoleH, overflowY: "auto", padding: "2px 12px 10px", fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 11, lineHeight: 1.75 }}>
        {filteredLogs.length === 0
          ? <div style={{ color: T.muted }}>
              {logs.length === 0 ? "\uCF58\uC194 \uCD9C\uB825\uC774 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4." : "\uD544\uD130 \uACB0\uACFC \uC5C6\uC74C"}
            </div>
          : filteredLogs.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: l.level === "error" ? `2px solid ${T.red}` : l.level === "warn" ? `2px solid ${T.warn}` : "2px solid transparent", paddingLeft: 6, marginBottom: 1 }}>
              <span style={{ color: T.muted, flexShrink: 0, fontSize: 9.5 }}>{l.ts}</span>
              <span style={{ color: logColor(l.level), flex: 1, wordBreak: "break-all" }}>{l.msg}</span>
              {l.level === "error" && (
                <button onClick={e => { e.stopPropagation(); runAI(`\uB2E4\uC74C JS \uC5D0\uB7EC\uB97C \uCC3E\uC544\uC11C \uC218\uC815\uD574\uC918 (\uC5D0\uB7EC \uBA54\uC2DC\uC9C0\uB97C \uAE30\uBC18\uC73C\uB85C \uC6D0\uC778 \uD30C\uC545 \uD6C4 \uCF54\uB4DC \uC218\uC815):\n${l.msg}`); setLeftTab("ai"); }}
                  style={{ flexShrink: 0, padding: "1px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${T.red}22`, border: `1px solid ${T.red}44`, color: T.red, cursor: "pointer", fontFamily: "inherit" }}>
                  {"\uC218\uC815"}
                </button>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );

  // ── Embedded mode: return just the content ────────────────────────────────
  if (embedded) {
    return consoleContent;
  }

  // ── Standalone mode: original wrapper with drag handle + header ────────────
  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.topbar }}>
      <DragHandle direction="vertical" onMouseDown={onDragStart} isDragging={draggingConsole} />
      <div onClick={() => setShowConsole(!showConsole)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", cursor: "pointer" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="1" width="8" height="8" rx="1.5"/><path d="M3 3.5l1.5 1.5L3 6.5M6 6.5h1.5"/>
          </svg>
          {"\uCF58\uC194"}
          {errorCount > 0 && (
            <span style={{ background: T.red, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 10, fontWeight: 700 }}>{errorCount}</span>
          )}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {errorCount > 0 && (
            <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) { clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); } autoFixErrors(); }}
              style={{ padding: "2px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
              {"\u2726"} AI {"\uC790\uB3D9 \uC218\uC815"}
              {autoFixCountdown !== null && (
                <span style={{ opacity: 0.75 }}>({autoFixCountdown}s)</span>
              )}
            </button>
          )}
          {autoFixCountdown !== null && (
            <button onClick={e => { e.stopPropagation(); if (autoFixTimerRef.current) clearInterval(autoFixTimerRef.current); setAutoFixCountdown(null); }}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>{"\uCDE8\uC18C"}</button>
          )}
          <button onClick={e => { e.stopPropagation(); clearLogs(); }}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>{"\uC9C0\uC6B0\uAE30"}</button>
          <span style={{ color: T.muted, fontSize: 12 }}>{showConsole ? "\u25BE" : "\u25B4"}</span>
        </div>
      </div>

      {showConsole && consoleContent}
    </div>
  );
}
