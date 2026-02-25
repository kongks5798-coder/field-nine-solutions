"use client";

import { useState, useMemo } from "react";
import { T } from "./workspace.constants";
import type { FilesMap } from "./workspace.constants";

export interface VersionHistoryPanelProps {
  history: Array<{ files: FilesMap; ts: string; label: string; epoch?: number }>;
  currentFiles: FilesMap;
  onRestore: (files: FilesMap) => void;
  onClose: () => void;
}

function relativeTime(epoch: number | undefined, ts: string): string {
  if (!epoch) return ts;
  const d = Date.now() - epoch;
  if (d < 60000) return "\uBC29\uAE08 \uC804";
  if (d < 3600000) return `${Math.floor(d / 60000)}\uBD84 \uC804`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}\uC2DC\uAC04 \uC804`;
  return `${Math.floor(d / 86400000)}\uC77C \uC804`;
}

function countChanges(a: FilesMap, b: FilesMap): number {
  let c = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (!a[k] || !b[k] || a[k].content !== b[k].content) c++;
  return c;
}

function diffSummary(older: FilesMap, newer: FilesMap) {
  const result: { name: string; added: number; removed: number }[] = [];
  const keys = new Set([...Object.keys(older), ...Object.keys(newer)]);
  for (const k of keys) {
    const ol = older[k]?.content.split("\n").length ?? 0;
    const nl = newer[k]?.content.split("\n").length ?? 0;
    if (!older[k] || !newer[k] || older[k].content !== newer[k].content)
      result.push({ name: k, added: Math.max(0, nl - ol) || nl, removed: Math.max(0, ol - nl) || ol });
  }
  return result;
}

export default function VersionHistoryPanel({ history, currentFiles, onRestore, onClose }: VersionHistoryPanelProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const entries = useMemo(() => {
    const rev = [...history].reverse();
    return rev.map((e, i) => {
      const prev = i < rev.length - 1 ? rev[i + 1].files : {};
      return { ...e, changed: countChanges(e.files, prev), index: i };
    });
  }, [history]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 800,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="vh-title"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0d1117", border: "1px solid #1e293b", borderRadius: 16,
          width: 480, maxWidth: "94vw", maxHeight: "80vh",
          display: "flex", flexDirection: "column", boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 14px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
          <h2 id="vh-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>
            {"\uD83D\uDCDC"} \uBC84\uC804 \uD788\uC2A4\uD1A0\uB9AC
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{history.length}/20</span>
            <button onClick={onClose} aria-label="\uB2EB\uAE30" style={{
              background: "none", border: "none", color: T.muted, fontSize: 18,
              cursor: "pointer", padding: "2px 4px", lineHeight: 1,
            }}>{"\u2715"}</button>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: T.muted, fontSize: 13, lineHeight: 1.8 }}>
              \uC544\uC9C1 \uD788\uC2A4\uD1A0\uB9AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.<br />
              AI\uB97C \uC0AC\uC6A9\uD558\uAC70\uB098 \uCF54\uB4DC\uB97C \uC218\uC815\uD558\uBA74 \uC790\uB3D9 \uC800\uC7A5\uB429\uB2C8\uB2E4.
            </div>
          ) : (
            <div style={{ position: "relative", paddingLeft: 20 }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "#1e293b", borderRadius: 1 }} />
              {/* Current state */}
              <div style={{ position: "relative", marginBottom: 16, paddingLeft: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)",
                  width: 10, height: 10, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}60` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{"\uD604\uC7AC \uC0C1\uD0DC"}</span>
                <span style={{ fontSize: 10, color: T.muted }}>({Object.keys(currentFiles).length} files)</span>
              </div>
              {/* Entries */}
              {entries.map((entry, i) => {
                const isExpanded = expandedIdx === i;
                const accent = i === 0 ? T.accent : "#64748b";
                const diffs = isExpanded ? diffSummary(i < entries.length - 1 ? entries[i + 1].files : {}, entry.files) : [];
                return (
                  <div key={i} style={{ position: "relative", marginBottom: 10, paddingLeft: 16 }}>
                    <div style={{ position: "absolute", left: -16, top: 14, transform: "translateY(-50%)",
                      width: 8, height: 8, borderRadius: "50%", background: accent, border: "2px solid #0d1117" }} />
                    <div style={{ background: "#fafafa", borderRadius: 10,
                      border: "1px solid #1e293b", borderLeft: `3px solid ${accent}`, padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: T.muted, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {relativeTime(entry.epoch, entry.ts)}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.text,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entry.label}
                          </span>
                        </div>
                        {entry.changed > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: T.accent,
                            background: `${T.accent}18`, padding: "2px 7px", borderRadius: 8, whiteSpace: "nowrap", marginLeft: 6 }}>
                            {entry.changed} file{entry.changed > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => onRestore(entry.files)} style={{
                          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${accent}50`, background: `${accent}15`,
                          color: accent, cursor: "pointer", fontFamily: "inherit",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${accent}30`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = `${accent}15`; }}
                        >{"\uBCF5\uC6D0"}</button>
                        <button onClick={() => setExpandedIdx(isExpanded ? null : i)} style={{
                          padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${T.border}`, background: "#f9fafb",
                          color: T.muted, cursor: "pointer", fontFamily: "inherit",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; }}
                        >{isExpanded ? "\uC811\uAE30" : "\uBE44\uAD50"}</button>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 8, padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderRadius: 6, fontSize: 11, lineHeight: 1.8 }}>
                          {diffs.length === 0 ? <span style={{ color: T.muted }}>{"\uBCC0\uACBD \uC5C6\uC74C"}</span> : diffs.map(d => (
                            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: T.text, fontWeight: 500 }}>{d.name}</span>
                              {d.added > 0 && <span style={{ color: T.green, fontWeight: 600 }}>+{d.added}</span>}
                              {d.removed > 0 && <span style={{ color: T.red, fontWeight: 600 }}>-{d.removed}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
