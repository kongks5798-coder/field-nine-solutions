"use client";

import React, { useMemo, useState, useCallback } from "react";
import { T } from "./workspace.constants";
import { useGitStore } from "./stores";
import type { GitCommit, GitBranch, GitState } from "./git/VirtualGit";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GraphNode {
  commit: GitCommit;
  x: number;       // lane index (0-based)
  y: number;       // vertical index (0 = newest)
  branch: string;  // which branch this commit belongs to
  color: string;
}

interface GraphEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const LANE_WIDTH = 24;
const ROW_HEIGHT = 48;
const DOT_RADIUS = 5;
const HEAD_RADIUS = 7;
const TOP_PADDING = 20;
const LEFT_PADDING = 20;

const BRANCH_COLORS = [
  "#f97316", // orange (main)
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
];

// ── Graph builder ──────────────────────────────────────────────────────────────

function buildGraph(gitState: GitState): { nodes: GraphNode[]; edges: GraphEdge[]; width: number; height: number } {
  const { commits, branches, HEAD, currentBranch } = gitState;

  if (commits.length === 0) {
    return { nodes: [], edges: [], width: 200, height: 100 };
  }

  // Build commit map
  const commitMap = new Map<string, GitCommit>();
  for (const c of commits) commitMap.set(c.id, c);

  // Assign branches to commits by walking from each branch head
  const commitBranch = new Map<string, string>();
  const branchColorMap = new Map<string, string>();

  // Assign colors — main gets first color
  const sortedBranches = [...branches].sort((a, b) => {
    if (a.name === currentBranch) return -1;
    if (b.name === currentBranch) return 1;
    if (a.name === "main") return -1;
    if (b.name === "main") return 1;
    return a.name.localeCompare(b.name);
  });

  sortedBranches.forEach((b, i) => {
    branchColorMap.set(b.name, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });

  // Walk each branch and mark commits
  for (const branch of sortedBranches) {
    let cid: string | null = branch.headCommitId;
    while (cid) {
      if (!commitBranch.has(cid)) {
        commitBranch.set(cid, branch.name);
      }
      const commit = commitMap.get(cid);
      if (!commit) break;
      cid = commit.parent;
    }
  }

  // Build all commits in chronological order (newest first)
  const allCommits = [...commits].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Assign lanes based on branch
  const branchLane = new Map<string, number>();
  let nextLane = 0;
  // Current branch always lane 0
  branchLane.set(currentBranch, nextLane++);
  for (const branch of sortedBranches) {
    if (!branchLane.has(branch.name)) {
      branchLane.set(branch.name, nextLane++);
    }
  }

  // Build nodes
  const nodes: GraphNode[] = [];
  const nodeMap = new Map<string, GraphNode>();

  for (let i = 0; i < allCommits.length; i++) {
    const commit = allCommits[i];
    const branchName = commitBranch.get(commit.id) || currentBranch;
    const lane = branchLane.get(branchName) ?? 0;
    const color = branchColorMap.get(branchName) || BRANCH_COLORS[0];

    const node: GraphNode = {
      commit,
      x: lane,
      y: i,
      branch: branchName,
      color,
    };
    nodes.push(node);
    nodeMap.set(commit.id, node);
  }

  // Build edges (parent connections)
  const edges: GraphEdge[] = [];
  for (const node of nodes) {
    if (node.commit.parent) {
      const parentNode = nodeMap.get(node.commit.parent);
      if (parentNode) {
        edges.push({
          fromX: node.x,
          fromY: node.y,
          toX: parentNode.x,
          toY: parentNode.y,
          color: node.color,
        });
      }
    }
  }

  const maxLane = Math.max(...nodes.map(n => n.x), 0);
  const graphWidth = LEFT_PADDING * 2 + (maxLane + 1) * LANE_WIDTH + 300;
  const graphHeight = TOP_PADDING * 2 + allCommits.length * ROW_HEIGHT;

  return { nodes, edges, width: graphWidth, height: graphHeight };
}

// ── Time formatting ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// ── Main Panel Component ───────────────────────────────────────────────────────

export interface GitGraphPanelProps {
  onClose: () => void;
}

export function GitGraphPanel({ onClose }: GitGraphPanelProps) {
  const gitState = useGitStore(s => s.gitState);
  const selectedCommitId = useGitStore(s => s.selectedCommitId);
  const setSelectedCommitId = useGitStore(s => s.setSelectedCommitId);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const { nodes, edges, width, height } = useMemo(() => buildGraph(gitState), [gitState]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (!filter) return nodes;
    const lower = filter.toLowerCase();
    return nodes.filter(n =>
      n.commit.message.toLowerCase().includes(lower) ||
      n.commit.id.includes(lower) ||
      n.branch.toLowerCase().includes(lower),
    );
  }, [nodes, filter]);

  // Branch labels (unique)
  const branchLabels = useMemo(() => {
    const map = new Map<string, { name: string; color: string; headId: string }>();
    for (const b of gitState.branches) {
      const node = nodes.find(n => n.commit.id === b.headCommitId);
      if (node) {
        map.set(b.name, { name: b.name, color: node.color, headId: b.headCommitId });
      }
    }
    return [...map.values()];
  }, [gitState.branches, nodes]);

  // Get selected commit details
  const selectedNode = useMemo(() => {
    if (!selectedCommitId) return null;
    return nodes.find(n => n.commit.id === selectedCommitId) || null;
  }, [selectedCommitId, nodes]);

  const handleSelectCommit = useCallback((id: string) => {
    setSelectedCommitId(selectedCommitId === id ? null : id);
  }, [selectedCommitId, setSelectedCommitId]);

  // SVG coordinate helpers
  const cx = (lane: number) => LEFT_PADDING + lane * LANE_WIDTH + LANE_WIDTH / 2;
  const cy = (row: number) => TOP_PADDING + row * ROW_HEIGHT + ROW_HEIGHT / 2;

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 480, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="4" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="6" r="2" />
            <path d="M4 6v4c0 1.1.9 2 2 2h4" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Git Graph</span>
          <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>
            {gitState.commits.length} commits / {gitState.branches.length} branches
          </span>
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Branch pills */}
      {branchLabels.length > 0 && (
        <div style={{
          display: "flex", gap: 6, padding: "8px 14px", borderBottom: `1px solid ${T.border}`,
          flexShrink: 0, flexWrap: "wrap",
        }}>
          {branchLabels.map(b => (
            <span key={b.name} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
              background: `${b.color}12`, color: b.color,
              border: `1px solid ${b.color}30`,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: b.color,
              }} />
              {b.name}
              {b.name === gitState.currentBranch && (
                <span style={{ fontSize: 8, opacity: 0.7 }}>(HEAD)</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search filter */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round">
            <circle cx="7" cy="7" r="4.5" /><path d="M11 11l3 3" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="커밋 메시지, ID, 브랜치 검색..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 11, color: T.text, fontFamily: "inherit",
            }}
          />
          {filter && (
            <button onClick={() => setFilter("")}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Graph + commit list */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {nodes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
            <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#d1d5db" strokeWidth="1" style={{ margin: "0 auto 12px" }}>
              <circle cx="4" cy="4" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="6" r="2" />
              <path d="M4 6v4c0 1.1.9 2 2 2h4" />
            </svg>
            <br />
            아직 커밋이 없습니다.<br />
            Git 패널에서 첫 커밋을 만들어보세요.
          </div>
        ) : filteredNodes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: T.muted, fontSize: 12 }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div style={{ position: "relative", minHeight: height }}>
            {/* SVG overlay for lines and dots */}
            <svg
              width={width}
              height={height}
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
            >
              {/* Edges (branch lines) */}
              {edges.map((edge, i) => {
                const x1 = cx(edge.fromX);
                const y1 = cy(edge.fromY);
                const x2 = cx(edge.toX);
                const y2 = cy(edge.toY);

                if (edge.fromX === edge.toX) {
                  // Straight vertical line
                  return (
                    <line
                      key={`e-${i}`}
                      x1={x1} y1={y1}
                      x2={x2} y2={y2}
                      stroke={edge.color}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  );
                } else {
                  // Curved merge/branch line
                  const midY = (y1 + y2) / 2;
                  return (
                    <path
                      key={`e-${i}`}
                      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                      fill="none"
                      stroke={edge.color}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  );
                }
              })}

              {/* Nodes (commit dots) */}
              {filteredNodes.map(node => {
                const x = cx(node.x);
                const y = cy(node.y);
                const isHead = node.commit.id === gitState.HEAD;
                const isHovered = hoveredId === node.commit.id;
                const isSelected = selectedCommitId === node.commit.id;
                const r = isHead ? HEAD_RADIUS : (isHovered || isSelected ? DOT_RADIUS + 1 : DOT_RADIUS);

                return (
                  <g key={node.commit.id}>
                    {/* Glow for HEAD */}
                    {isHead && (
                      <circle cx={x} cy={y} r={r + 4} fill={node.color} opacity={0.15} />
                    )}
                    {/* Selection ring */}
                    {isSelected && (
                      <circle cx={x} cy={y} r={r + 3} fill="none" stroke={node.color} strokeWidth={1.5} strokeDasharray="3 2" />
                    )}
                    {/* Dot */}
                    <circle
                      cx={x} cy={y} r={r}
                      fill={isHead ? node.color : "#fff"}
                      stroke={node.color}
                      strokeWidth={2}
                      style={{ pointerEvents: "all", cursor: "pointer", transition: "r 0.15s" }}
                      onMouseEnter={() => setHoveredId(node.commit.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleSelectCommit(node.commit.id)}
                    />
                    {/* HEAD label */}
                    {isHead && (
                      <text
                        x={x} y={y - r - 6}
                        textAnchor="middle"
                        fill={node.color}
                        fontSize={8}
                        fontWeight={700}
                        fontFamily="-apple-system, sans-serif"
                      >
                        HEAD
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Commit labels (positioned absolutely) */}
            {filteredNodes.map(node => {
              const y = cy(node.y);
              const maxLane = Math.max(...nodes.map(n => n.x), 0);
              const labelLeft = LEFT_PADDING + (maxLane + 1) * LANE_WIDTH + 16;
              const isSelected = selectedCommitId === node.commit.id;
              const isHovered = hoveredId === node.commit.id;
              const isHead = node.commit.id === gitState.HEAD;

              // Find branch label for this commit
              const branchAtCommit = gitState.branches.find(b => b.headCommitId === node.commit.id);

              return (
                <div
                  key={`label-${node.commit.id}`}
                  onClick={() => handleSelectCommit(node.commit.id)}
                  onMouseEnter={() => setHoveredId(node.commit.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    position: "absolute",
                    top: y - ROW_HEIGHT / 2,
                    left: labelLeft,
                    right: 14,
                    height: ROW_HEIGHT,
                    display: "flex", alignItems: "center", gap: 8,
                    cursor: "pointer",
                    padding: "0 10px",
                    borderRadius: 6,
                    background: isSelected
                      ? `rgba(249,115,22,0.06)`
                      : isHovered ? "#f9fafb" : "transparent",
                    transition: "background 0.12s",
                    borderLeft: isSelected ? `3px solid ${T.accent}` : "3px solid transparent",
                  }}
                >
                  {/* Commit hash */}
                  <code style={{
                    fontSize: 10, fontWeight: 600, color: node.color,
                    fontFamily: '"JetBrains Mono","Fira Code",monospace',
                    flexShrink: 0, width: 52,
                  }}>
                    {node.commit.id}
                  </code>

                  {/* Branch label */}
                  {branchAtCommit && (
                    <span style={{
                      fontSize: 8, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 4,
                      background: `${node.color}18`,
                      color: node.color,
                      border: `1px solid ${node.color}30`,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}>
                      {branchAtCommit.name}
                    </span>
                  )}

                  {/* Commit message */}
                  <span style={{
                    fontSize: 11, color: T.text,
                    fontWeight: isHead ? 600 : 400,
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", flex: 1,
                  }}>
                    {node.commit.message}
                  </span>

                  {/* Time */}
                  <span style={{
                    fontSize: 9, color: T.muted, flexShrink: 0,
                    fontFamily: '"JetBrains Mono",monospace',
                  }}>
                    {formatTime(node.commit.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected commit details */}
      {selectedNode && (
        <div style={{
          flexShrink: 0, borderTop: `1px solid ${T.border}`,
          padding: "12px 14px", background: "#f9fafb",
          maxHeight: 180, overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: selectedNode.color,
            }} />
            <code style={{
              fontSize: 11, fontWeight: 700, color: selectedNode.color,
              fontFamily: '"JetBrains Mono","Fira Code",monospace',
            }}>
              {selectedNode.commit.id}
            </code>
            <span style={{ fontSize: 10, color: T.muted }}>
              on {selectedNode.branch}
            </span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            {selectedNode.commit.message}
          </div>

          <div style={{ fontSize: 10, color: T.muted, marginBottom: 8 }}>
            {new Date(selectedNode.commit.timestamp).toLocaleString("ko-KR")}
          </div>

          {/* Files in this commit */}
          <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.04em", marginBottom: 4 }}>
            파일 ({Object.keys(selectedNode.commit.files).length}개)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Object.keys(selectedNode.commit.files).map(f => (
              <span key={f} style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 4,
                background: "#e5e7eb", color: T.text, fontWeight: 500,
                fontFamily: '"JetBrains Mono",monospace',
              }}>
                {f}
              </span>
            ))}
          </div>

          {/* Parent link */}
          {selectedNode.commit.parent && (
            <div style={{ marginTop: 6, fontSize: 10, color: T.muted }}>
              Parent:{" "}
              <button
                onClick={() => setSelectedCommitId(selectedNode.commit.parent)}
                style={{
                  background: "none", border: "none", color: T.info,
                  cursor: "pointer", fontSize: 10, fontWeight: 600, padding: 0,
                  fontFamily: '"JetBrains Mono",monospace', textDecoration: "underline",
                }}
              >
                {selectedNode.commit.parent}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
