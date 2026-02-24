"use client";

import React, { useState, useMemo } from "react";
import { T } from "./workspace.constants";

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  filename: string;
  onAccept: () => void;
  onReject: () => void;
}

type DiffLineType = "same" | "added" | "removed" | "modified";

interface DiffLine {
  type: DiffLineType;
  oldLineNum: number | null;
  newLineNum: number | null;
  oldContent: string;
  newContent: string;
}

/**
 * Simple line-by-line diff algorithm.
 * Compares old and new code line by line using an LCS-based approach
 * to produce added/removed/same hunks.
 */
function computeDiff(oldCode: string, newCode: string): DiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const result: DiffLine[] = [];

  // LCS table for matching lines
  const m = oldLines.length;
  const n = newLines.length;

  // For very large files, fall back to simple line comparison
  if (m * n > 500000) {
    return computeSimpleDiff(oldLines, newLines);
  }

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Trace back to build diff
  const diffOps: Array<{ type: "same" | "add" | "remove"; oldIdx?: number; newIdx?: number }> = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffOps.unshift({ type: "same", oldIdx: i - 1, newIdx: j - 1 });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffOps.unshift({ type: "add", newIdx: j - 1 });
      j--;
    } else {
      diffOps.unshift({ type: "remove", oldIdx: i - 1 });
      i--;
    }
  }

  // Convert to DiffLine[]
  let oldNum = 0;
  let newNum = 0;
  for (const op of diffOps) {
    if (op.type === "same") {
      oldNum++;
      newNum++;
      result.push({
        type: "same",
        oldLineNum: oldNum,
        newLineNum: newNum,
        oldContent: oldLines[op.oldIdx!],
        newContent: newLines[op.newIdx!],
      });
    } else if (op.type === "remove") {
      oldNum++;
      result.push({
        type: "removed",
        oldLineNum: oldNum,
        newLineNum: null,
        oldContent: oldLines[op.oldIdx!],
        newContent: "",
      });
    } else {
      newNum++;
      result.push({
        type: "added",
        oldLineNum: null,
        newLineNum: newNum,
        oldContent: "",
        newContent: newLines[op.newIdx!],
      });
    }
  }

  return result;
}

function computeSimpleDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let oldNum = 0;
  let newNum = 0;

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;

    if (oldLine !== undefined && newLine !== undefined) {
      oldNum++;
      newNum++;
      if (oldLine === newLine) {
        result.push({ type: "same", oldLineNum: oldNum, newLineNum: newNum, oldContent: oldLine, newContent: newLine });
      } else {
        result.push({ type: "modified", oldLineNum: oldNum, newLineNum: newNum, oldContent: oldLine, newContent: newLine });
      }
    } else if (oldLine !== undefined) {
      oldNum++;
      result.push({ type: "removed", oldLineNum: oldNum, newLineNum: null, oldContent: oldLine, newContent: "" });
    } else if (newLine !== undefined) {
      newNum++;
      result.push({ type: "added", oldLineNum: null, newLineNum: newNum, oldContent: "", newContent: newLine });
    }
  }
  return result;
}

const LINE_BG: Record<DiffLineType, string> = {
  same:     "transparent",
  added:    "rgba(34,197,94,0.1)",
  removed:  "rgba(248,113,113,0.1)",
  modified: "rgba(251,191,36,0.08)",
};

const LINE_BORDER: Record<DiffLineType, string> = {
  same:     "transparent",
  added:    "rgba(34,197,94,0.4)",
  removed:  "rgba(248,113,113,0.4)",
  modified: "rgba(251,191,36,0.35)",
};

export function DiffViewer({ oldCode, newCode, filename, onAccept, onReject }: DiffViewerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const diffLines = useMemo(() => computeDiff(oldCode, newCode), [oldCode, newCode]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, modified = 0;
    for (const line of diffLines) {
      if (line.type === "added") added++;
      else if (line.type === "removed") removed++;
      else if (line.type === "modified") modified++;
    }
    return { added, removed, modified };
  }, [diffLines]);

  return (
    <div style={{
      border: `1px solid ${T.borderHi}`,
      borderRadius: 12,
      overflow: "hidden",
      background: T.surface,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: T.topbar,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: "none", border: "none", color: T.muted,
              cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1,
            }}
          >
            {collapsed ? "\u25B6" : "\u25BC"}
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{filename}</span>
          <div style={{ display: "flex", gap: 6, fontSize: 10 }}>
            {stats.added > 0 && (
              <span style={{ color: T.green, fontWeight: 600 }}>+{stats.added}</span>
            )}
            {stats.removed > 0 && (
              <span style={{ color: T.red, fontWeight: 600 }}>-{stats.removed}</span>
            )}
            {stats.modified > 0 && (
              <span style={{ color: T.warn, fontWeight: 600 }}>{"\u2248"}{stats.modified}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View mode toggle */}
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${T.border}` }}>
            {(["split", "unified"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "3px 10px", fontSize: 10, fontWeight: 600,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: viewMode === mode ? `${T.accent}20` : "transparent",
                  color: viewMode === mode ? T.accent : T.muted,
                }}
              >
                {mode === "split" ? "\uC88C\uC6B0" : "\uD1B5\uD569"}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <button
            onClick={onAccept}
            style={{
              padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
              background: `linear-gradient(135deg, ${T.green}, #16a34a)`,
              border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 2px 10px rgba(34,197,94,0.3)",
            }}
          >
            {"\u2713"} {"\uC801\uC6A9"}
          </button>
          <button
            onClick={onReject}
            style={{
              padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700,
              background: "rgba(248,113,113,0.1)",
              border: `1px solid ${T.red}44`,
              color: T.red, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {"\u21A9"} {"\uB418\uB3CC\uB9AC\uAE30"}
          </button>
        </div>
      </div>

      {/* Diff content */}
      {!collapsed && (
        <div style={{
          maxHeight: 500, overflowY: "auto", overflowX: "auto",
          fontFamily: '"JetBrains Mono","Fira Code",monospace',
          fontSize: 12, lineHeight: 1.6,
        }}>
          {viewMode === "split" ? (
            /* Split view */
            <div style={{ display: "flex", minWidth: "100%" }}>
              {/* Old code (left) */}
              <div style={{ flex: 1, borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
                <div style={{
                  padding: "4px 10px", fontSize: 10, fontWeight: 700,
                  color: T.red, background: "rgba(248,113,113,0.05)",
                  borderBottom: `1px solid ${T.border}`,
                  position: "sticky", top: 0, zIndex: 1,
                }}>
                  Old
                </div>
                {diffLines.map((line, i) => (
                  <div key={`old-${i}`} style={{
                    display: "flex", minHeight: 22,
                    background: LINE_BG[line.type],
                    borderLeft: `3px solid ${LINE_BORDER[line.type]}`,
                  }}>
                    <span style={{
                      width: 40, textAlign: "right", paddingRight: 8,
                      color: T.muted, fontSize: 10, opacity: 0.6,
                      userSelect: "none", flexShrink: 0, lineHeight: "22px",
                    }}>
                      {line.oldLineNum ?? ""}
                    </span>
                    <pre style={{
                      margin: 0, padding: "0 8px", whiteSpace: "pre-wrap",
                      wordBreak: "break-all", flex: 1, lineHeight: "22px",
                      color: line.type === "removed" ? T.red : line.type === "modified" ? T.warn : T.text,
                      textDecoration: line.type === "removed" ? "line-through" : "none",
                      opacity: line.type === "added" ? 0.3 : 1,
                    }}>
                      {line.oldContent || (line.type === "added" ? "" : " ")}
                    </pre>
                  </div>
                ))}
              </div>

              {/* New code (right) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  padding: "4px 10px", fontSize: 10, fontWeight: 700,
                  color: T.green, background: "rgba(34,197,94,0.05)",
                  borderBottom: `1px solid ${T.border}`,
                  position: "sticky", top: 0, zIndex: 1,
                }}>
                  New
                </div>
                {diffLines.map((line, i) => (
                  <div key={`new-${i}`} style={{
                    display: "flex", minHeight: 22,
                    background: LINE_BG[line.type],
                    borderLeft: `3px solid ${LINE_BORDER[line.type]}`,
                  }}>
                    <span style={{
                      width: 40, textAlign: "right", paddingRight: 8,
                      color: T.muted, fontSize: 10, opacity: 0.6,
                      userSelect: "none", flexShrink: 0, lineHeight: "22px",
                    }}>
                      {line.newLineNum ?? ""}
                    </span>
                    <pre style={{
                      margin: 0, padding: "0 8px", whiteSpace: "pre-wrap",
                      wordBreak: "break-all", flex: 1, lineHeight: "22px",
                      color: line.type === "added" ? T.green : line.type === "modified" ? T.warn : T.text,
                      opacity: line.type === "removed" ? 0.3 : 1,
                    }}>
                      {line.newContent || (line.type === "removed" ? "" : " ")}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Unified view */
            <div>
              <div style={{
                padding: "4px 10px", fontSize: 10, fontWeight: 700,
                color: T.muted, background: "rgba(255,255,255,0.02)",
                borderBottom: `1px solid ${T.border}`,
                position: "sticky", top: 0, zIndex: 1,
              }}>
                {"\uD1B5\uD569 \uBDF0"}
              </div>
              {diffLines.map((line, i) => {
                if (line.type === "same") {
                  return (
                    <div key={i} style={{ display: "flex", minHeight: 22 }}>
                      <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}>
                        {line.oldLineNum}
                      </span>
                      <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}>
                        {line.newLineNum}
                      </span>
                      <span style={{ width: 16, textAlign: "center", color: T.muted, flexShrink: 0, lineHeight: "22px" }}> </span>
                      <pre style={{ margin: 0, padding: "0 8px", whiteSpace: "pre-wrap", wordBreak: "break-all", flex: 1, lineHeight: "22px", color: T.text }}>
                        {line.oldContent}
                      </pre>
                    </div>
                  );
                }
                if (line.type === "removed" || line.type === "modified") {
                  const rows = [(
                    <div key={`${i}-old`} style={{ display: "flex", minHeight: 22, background: "rgba(248,113,113,0.1)", borderLeft: `3px solid rgba(248,113,113,0.4)` }}>
                      <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}>
                        {line.oldLineNum}
                      </span>
                      <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}> </span>
                      <span style={{ width: 16, textAlign: "center", color: T.red, fontWeight: 700, flexShrink: 0, lineHeight: "22px" }}>-</span>
                      <pre style={{ margin: 0, padding: "0 8px", whiteSpace: "pre-wrap", wordBreak: "break-all", flex: 1, lineHeight: "22px", color: T.red }}>
                        {line.oldContent}
                      </pre>
                    </div>
                  )];
                  if (line.type === "modified") {
                    rows.push(
                      <div key={`${i}-new`} style={{ display: "flex", minHeight: 22, background: "rgba(34,197,94,0.1)", borderLeft: `3px solid rgba(34,197,94,0.4)` }}>
                        <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}> </span>
                        <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}>
                          {line.newLineNum}
                        </span>
                        <span style={{ width: 16, textAlign: "center", color: T.green, fontWeight: 700, flexShrink: 0, lineHeight: "22px" }}>+</span>
                        <pre style={{ margin: 0, padding: "0 8px", whiteSpace: "pre-wrap", wordBreak: "break-all", flex: 1, lineHeight: "22px", color: T.green }}>
                          {line.newContent}
                        </pre>
                      </div>
                    );
                  }
                  return <React.Fragment key={i}>{rows}</React.Fragment>;
                }
                // added
                return (
                  <div key={i} style={{ display: "flex", minHeight: 22, background: "rgba(34,197,94,0.1)", borderLeft: `3px solid rgba(34,197,94,0.4)` }}>
                    <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}> </span>
                    <span style={{ width: 36, textAlign: "right", paddingRight: 6, color: T.muted, fontSize: 10, opacity: 0.5, userSelect: "none", flexShrink: 0, lineHeight: "22px" }}>
                      {line.newLineNum}
                    </span>
                    <span style={{ width: 16, textAlign: "center", color: T.green, fontWeight: 700, flexShrink: 0, lineHeight: "22px" }}>+</span>
                    <pre style={{ margin: 0, padding: "0 8px", whiteSpace: "pre-wrap", wordBreak: "break-all", flex: 1, lineHeight: "22px", color: T.green }}>
                      {line.newContent}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
