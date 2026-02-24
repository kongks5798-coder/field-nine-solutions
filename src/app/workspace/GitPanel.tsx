"use client";

import React, { useState, useMemo, useCallback } from "react";
import { T } from "./workspace.constants";
import { useGitStore } from "./stores";
import type { GitCommit, FileDiff } from "./git/VirtualGit";
import { diffCommits } from "./git/VirtualGit";

// ── Inline Diff Renderer ───────────────────────────────────────────────────────

function InlineDiff({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  // Simple line-based diff: show removed then added lines
  const maxLines = Math.max(oldLines.length, newLines.length);
  const diffLines: { type: "same" | "add" | "del"; text: string }[] = [];

  // Very simple diff: compare line by line
  let oi = 0;
  let ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    const ol = oi < oldLines.length ? oldLines[oi] : undefined;
    const nl = ni < newLines.length ? newLines[ni] : undefined;

    if (ol === nl) {
      diffLines.push({ type: "same", text: ol ?? "" });
      oi++;
      ni++;
    } else if (ol !== undefined && (nl === undefined || !newLines.slice(ni).includes(ol))) {
      diffLines.push({ type: "del", text: ol });
      oi++;
    } else if (nl !== undefined && (ol === undefined || !oldLines.slice(oi).includes(nl))) {
      diffLines.push({ type: "add", text: nl });
      ni++;
    } else {
      // Lines diverged but both exist later — output del then add
      if (ol !== undefined) {
        diffLines.push({ type: "del", text: ol });
        oi++;
      }
      if (nl !== undefined) {
        diffLines.push({ type: "add", text: nl });
        ni++;
      }
    }

    // Safety: prevent infinite loops on large files
    if (diffLines.length > 500) {
      diffLines.push({ type: "same", text: "... (truncated)" });
      break;
    }
  }

  return (
    <div style={{
      fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
      fontSize: 11, lineHeight: "18px",
      maxHeight: 260, overflowY: "auto",
      background: "rgba(0,0,0,0.3)",
      borderRadius: 6, padding: "6px 0",
      margin: "6px 0",
    }}>
      {diffLines.map((line, i) => (
        <div
          key={i}
          style={{
            padding: "0 10px",
            background:
              line.type === "add" ? "rgba(34,197,94,0.10)" :
              line.type === "del" ? "rgba(248,113,113,0.10)" :
              "transparent",
            color:
              line.type === "add" ? T.green :
              line.type === "del" ? T.red :
              "rgba(212,216,226,0.5)",
            whiteSpace: "pre",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span style={{ display: "inline-block", width: 16, color: T.muted, userSelect: "none" }}>
            {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
          </span>
          {line.text}
        </div>
      ))}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FileDiff["status"] }) {
  const config = {
    added:    { bg: "rgba(34,197,94,0.15)", color: T.green,  label: "A" },
    modified: { bg: "rgba(249,115,22,0.15)", color: T.accent, label: "M" },
    deleted:  { bg: "rgba(248,113,113,0.15)", color: T.red,   label: "D" },
  }[status];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 18, height: 18, borderRadius: 4,
      background: config.bg, color: config.color,
      fontSize: 10, fontWeight: 700,
      fontFamily: '"JetBrains Mono",monospace',
    }}>
      {config.label}
    </span>
  );
}

// ── Main GitPanel ──────────────────────────────────────────────────────────────

export function GitPanel() {
  const gitState = useGitStore(s => s.gitState);
  const selectedCommitId = useGitStore(s => s.selectedCommitId);
  const setSelectedCommitId = useGitStore(s => s.setSelectedCommitId);
  const commitAction = useGitStore(s => s.commit);
  const branchAction = useGitStore(s => s.branch);
  const checkoutAction = useGitStore(s => s.checkout);
  const getLog = useGitStore(s => s.getLog);
  const getWorkingDiff = useGitStore(s => s.getWorkingDiff);

  const [commitMsg, setCommitMsg] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  // Commit history
  const log = useMemo(() => getLog(50), [gitState, getLog]);
  // Working tree changes
  const workingDiff = useMemo(() => getWorkingDiff(), [gitState, getWorkingDiff]);

  // Selected commit diff
  const selectedDiff = useMemo(() => {
    if (!selectedCommitId) return null;
    const commit = gitState.commits.find(c => c.id === selectedCommitId);
    if (!commit) return null;
    if (commit.parent) {
      const parent = gitState.commits.find(c => c.id === commit.parent);
      if (parent) return diffCommits(parent, commit);
    }
    // First commit — diff against empty
    return Object.entries(commit.files).map(([filename, content]) => ({
      filename,
      status: "added" as const,
      oldContent: "",
      newContent: content,
    }));
  }, [selectedCommitId, gitState]);

  const handleCommit = useCallback(() => {
    const msg = commitMsg.trim();
    if (!msg) return;
    commitAction(msg);
    setCommitMsg("");
  }, [commitMsg, commitAction]);

  const handleNewBranch = useCallback(() => {
    const name = newBranchName.trim();
    if (!name) return;
    branchAction(name);
    setNewBranchName("");
    setShowNewBranch(false);
  }, [newBranchName, branchAction]);

  const handleCheckout = useCallback((name: string) => {
    checkoutAction(name);
    setShowBranchDropdown(false);
  }, [checkoutAction]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", color: T.text,
      fontSize: 12, fontFamily: "inherit",
      overflow: "hidden",
    }}>
      {/* ── Branch selector ────────────────────────────────────── */}
      <div style={{
        padding: "10px 12px 8px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {/* Branch dropdown */}
        <div style={{ position: "relative", flex: 1 }}>
          <button
            onClick={() => setShowBranchDropdown(!showBranchDropdown)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "5px 10px",
              color: T.text, cursor: "pointer",
              fontSize: 12, fontFamily: "inherit",
              width: "100%",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="3" r="2"/><circle cx="11" cy="13" r="2"/><circle cx="11" cy="6" r="2"/>
              <path d="M5 5v6M5 11c0 1.1.9 2 2 2h2"/>
            </svg>
            <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>{gitState.currentBranch}</span>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </button>

          {/* Dropdown */}
          {showBranchDropdown && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              marginTop: 4, zIndex: 100,
              background: T.surface,
              border: `1px solid ${T.borderHi}`,
              borderRadius: 8,
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}>
              {gitState.branches.map(b => (
                <button
                  key={b.name}
                  onClick={() => handleCheckout(b.name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "7px 12px",
                    background: b.name === gitState.currentBranch ? "rgba(249,115,22,0.08)" : "transparent",
                    border: "none", cursor: "pointer",
                    color: b.name === gitState.currentBranch ? T.accent : T.text,
                    fontSize: 12, fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { if (b.name !== gitState.currentBranch) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (b.name !== gitState.currentBranch) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ width: 14, textAlign: "center", fontSize: 10 }}>
                    {b.name === gitState.currentBranch ? "\u25CF" : ""}
                  </span>
                  <span style={{ fontWeight: b.name === gitState.currentBranch ? 600 : 400 }}>
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New Branch button */}
        <button
          onClick={() => setShowNewBranch(!showNewBranch)}
          title="New Branch"
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: showNewBranch ? "rgba(249,115,22,0.10)" : "rgba(255,255,255,0.04)",
            color: showNewBranch ? T.accent : T.muted,
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 300,
            transition: "all 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = showNewBranch ? T.accent : T.muted; }}
        >
          +
        </button>
      </div>

      {/* ── New branch input ───────────────────────────────────── */}
      {showNewBranch && (
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", gap: 6,
        }}>
          <input
            value={newBranchName}
            onChange={e => setNewBranchName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleNewBranch(); if (e.key === "Escape") setShowNewBranch(false); }}
            placeholder="branch-name"
            autoFocus
            style={{
              flex: 1, background: "rgba(0,0,0,0.3)",
              border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "5px 8px",
              color: T.text, fontSize: 12, fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.accent}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          <button
            onClick={handleNewBranch}
            disabled={!newBranchName.trim()}
            style={{
              background: T.accent, color: "#fff",
              border: "none", borderRadius: 6,
              padding: "5px 12px", fontSize: 11,
              fontWeight: 700, cursor: newBranchName.trim() ? "pointer" : "not-allowed",
              opacity: newBranchName.trim() ? 1 : 0.4,
            }}
          >
            Create
          </button>
        </div>
      )}

      {/* ── Commit input ───────────────────────────────────────── */}
      <div style={{
        padding: "10px 12px 8px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{
          display: "flex", gap: 6, alignItems: "stretch",
        }}>
          <input
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCommit(); } }}
            placeholder="Commit message..."
            style={{
              flex: 1, background: "rgba(0,0,0,0.3)",
              border: `1px solid ${T.border}`,
              borderRadius: 6, padding: "6px 10px",
              color: T.text, fontSize: 12, fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={e => e.currentTarget.style.borderColor = T.accent}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          <button
            onClick={handleCommit}
            disabled={!commitMsg.trim()}
            style={{
              background: commitMsg.trim() ? "linear-gradient(135deg, #f97316, #f43f5e)" : "rgba(255,255,255,0.06)",
              color: commitMsg.trim() ? "#fff" : T.muted,
              border: "none", borderRadius: 6,
              padding: "6px 14px", fontSize: 11,
              fontWeight: 700, cursor: commitMsg.trim() ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              boxShadow: commitMsg.trim() ? "0 2px 12px rgba(249,115,22,0.3)" : "none",
              transition: "all 0.15s",
            }}
          >
            Commit
          </button>
        </div>

        {/* Changed files count */}
        {workingDiff.length > 0 && (
          <div style={{
            marginTop: 6, fontSize: 11, color: T.muted,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{ color: T.accent, fontWeight: 600 }}>{workingDiff.length}</span>
            <span>changed file{workingDiff.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── Working Changes ────────────────────────────────────── */}
        {workingDiff.length > 0 && (
          <div style={{ padding: "8px 0" }}>
            <div style={{
              padding: "4px 12px 6px", fontSize: 10,
              color: T.muted, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Changes
            </div>
            {workingDiff.map(diff => (
              <div key={diff.filename}>
                <button
                  onClick={() => setExpandedFile(expandedFile === `wt_${diff.filename}` ? null : `wt_${diff.filename}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "5px 12px",
                    background: expandedFile === `wt_${diff.filename}` ? "rgba(249,115,22,0.06)" : "transparent",
                    border: "none", cursor: "pointer",
                    color: T.text, fontSize: 12, fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = expandedFile === `wt_${diff.filename}` ? "rgba(249,115,22,0.06)" : "transparent"; }}
                >
                  <StatusBadge status={diff.status} />
                  <span style={{ flex: 1 }}>{diff.filename}</span>
                  <svg
                    width="10" height="10" viewBox="0 0 16 16"
                    fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round"
                    style={{
                      transform: expandedFile === `wt_${diff.filename}` ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                    }}
                  >
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </button>
                {expandedFile === `wt_${diff.filename}` && (
                  <div style={{ padding: "0 12px 4px" }}>
                    <InlineDiff oldContent={diff.oldContent} newContent={diff.newContent} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Commit History ─────────────────────────────────────── */}
        <div style={{ padding: "8px 0" }}>
          <div style={{
            padding: "4px 12px 6px", fontSize: 10,
            color: T.muted, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            borderTop: workingDiff.length > 0 ? `1px solid ${T.border}` : "none",
            paddingTop: workingDiff.length > 0 ? 10 : 4,
          }}>
            Commit History
          </div>

          {log.length === 0 ? (
            <div style={{
              padding: "20px 12px", textAlign: "center",
              color: T.muted, fontSize: 12,
            }}>
              No commits yet.
              <br />
              <span style={{ fontSize: 11 }}>Write a message above and click Commit.</span>
            </div>
          ) : (
            log.map(commit => (
              <div key={commit.id}>
                <button
                  onClick={() => setSelectedCommitId(selectedCommitId === commit.id ? null : commit.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    width: "100%", padding: "8px 12px",
                    background: selectedCommitId === commit.id ? "rgba(249,115,22,0.06)" : "transparent",
                    border: "none", cursor: "pointer",
                    color: T.text, fontSize: 12, fontFamily: "inherit",
                    textAlign: "left",
                    borderLeft: selectedCommitId === commit.id ? `2px solid ${T.accent}` : "2px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (selectedCommitId !== commit.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={e => {
                    if (selectedCommitId !== commit.id) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Commit indicator dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: T.accent, marginTop: 4, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <code style={{
                        fontSize: 10, color: T.accent,
                        fontFamily: '"JetBrains Mono",monospace',
                        fontWeight: 600,
                      }}>
                        {commit.id}
                      </code>
                      <span style={{
                        fontSize: 10, color: T.muted,
                      }}>
                        {formatTimestamp(commit.timestamp)}
                      </span>
                    </div>
                    <div style={{
                      marginTop: 2, fontSize: 12,
                      color: selectedCommitId === commit.id ? T.text : "rgba(212,216,226,0.7)",
                      fontWeight: selectedCommitId === commit.id ? 600 : 400,
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {commit.message}
                    </div>
                  </div>
                </button>

                {/* Expanded diff view */}
                {selectedCommitId === commit.id && selectedDiff && (
                  <div style={{
                    padding: "4px 12px 10px",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    {selectedDiff.length === 0 ? (
                      <div style={{ color: T.muted, fontSize: 11, padding: "8px 0" }}>
                        No file changes in this commit.
                      </div>
                    ) : (
                      selectedDiff.map(diff => (
                        <div key={diff.filename}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFile(expandedFile === `c_${commit.id}_${diff.filename}` ? null : `c_${commit.id}_${diff.filename}`);
                            }}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              width: "100%", padding: "4px 0",
                              background: "transparent",
                              border: "none", cursor: "pointer",
                              color: T.text, fontSize: 11, fontFamily: "inherit",
                              textAlign: "left",
                            }}
                          >
                            <StatusBadge status={diff.status} />
                            <span style={{ flex: 1 }}>{diff.filename}</span>
                            <svg
                              width="9" height="9" viewBox="0 0 16 16"
                              fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round"
                              style={{
                                transform: expandedFile === `c_${commit.id}_${diff.filename}` ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.15s",
                              }}
                            >
                              <path d="M4 6l4 4 4-4"/>
                            </svg>
                          </button>
                          {expandedFile === `c_${commit.id}_${diff.filename}` && (
                            <InlineDiff oldContent={diff.oldContent} newContent={diff.newContent} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${mins}`;
  } catch {
    return iso;
  }
}
