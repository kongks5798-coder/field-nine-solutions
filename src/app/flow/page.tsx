"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { FlowRunResult, FlowExecutionResult } from "@/types/flow";
import { T as _T } from "@/lib/theme";

const T = { ..._T, purple: "#a855f7" };

type NodeType = "trigger" | "ai" | "http" | "condition" | "email" | "code" | "output";
type NodeStatus = "idle" | "running" | "done" | "error" | "skipped";

interface FlowNode {
  id:      string;
  type:    NodeType;
  label:   string;
  x:       number;
  y:       number;
  config:  Record<string, string>;
  status:  NodeStatus;
  output?: string;
}

interface FlowEdge {
  id:   string;
  from: string;
  to:   string;
}

/**
 * Map from page NodeType to API FlowNode.type for the execute endpoint.
 * "code" maps to "transform" (safe template, no eval).
 * "output" maps to "transform" (passthrough).
 */
type ApiNodeType = 'trigger' | 'http_request' | 'ai_chat' | 'send_email' | 'transform' | 'condition';

const PAGE_TO_API_TYPE: Record<NodeType, ApiNodeType> = {
  trigger:   'trigger',
  ai:        'ai_chat',
  http:      'http_request',
  condition: 'condition',
  email:     'send_email',
  code:      'transform',
  output:    'transform',
};

const NODE_COLORS: Record<NodeType, string> = {
  trigger:   T.green,
  ai:        T.purple,
  http:      T.blue,
  condition: T.yellow,
  email:     T.accent,
  code:      T.muted,
  output:    T.green,
};

const NODE_ICONS: Record<NodeType, string> = {
  trigger:   "\u26A1",
  ai:        "\uD83E\uDD16",
  http:      "\uD83C\uDF10",
  condition: "\uD83D\uDD00",
  email:     "\uD83D\uDCE7",
  code:      "</>",
  output:    "\uD83D\uDCE4",
};

const NODE_TYPES: { type: NodeType; label: string; desc: string }[] = [
  { type: "trigger",   label: "\uD2B8\uB9AC\uAC70",    desc: "\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2DC\uC791\uC810" },
  { type: "ai",        label: "AI \uB178\uB4DC",   desc: "GPT, Claude, Gemini \uD638\uCD9C" },
  { type: "http",      label: "HTTP",      desc: "REST API \uD638\uCD9C" },
  { type: "condition", label: "\uC870\uAC74",      desc: "\uBD84\uAE30 \uCC98\uB9AC" },
  { type: "email",     label: "\uC774\uBA54\uC77C",    desc: "\uC774\uBA54\uC77C \uC804\uC1A1" },
  { type: "code",      label: "\uBCC0\uD658",      desc: "\uB370\uC774\uD130 \uBCC0\uD658 (safe template)" },
  { type: "output",    label: "\uCD9C\uB825",      desc: "\uACB0\uACFC \uC800\uC7A5" },
];

const TEMPLATES = [
  {
    name: "AI \uCF58\uD150\uCE20 \uC0DD\uC131",
    nodes: [
      { id: "n1", type: "trigger" as NodeType, label: "\uB9E4\uC77C 09:00", x: 80,  y: 200, config: { cron: "0 9 * * *" }, status: "idle" as NodeStatus },
      { id: "n2", type: "ai"      as NodeType, label: "\uBE14\uB85C\uADF8 \uCD08\uC548", x: 320, y: 200, config: { model: "claude-sonnet-4-6", prompt: "\uC624\uB298\uC758 AI \uD2B8\uB80C\uB4DC \uBE14\uB85C\uADF8 \uD3EC\uC2A4\uD2B8\uB97C 500\uC790\uB85C \uC791\uC131\uD574\uC8FC\uC138\uC694." }, status: "idle" as NodeStatus },
      { id: "n3", type: "email"   as NodeType, label: "\uC774\uBA54\uC77C \uBC1C\uC1A1", x: 560, y: 200, config: { to: "team@company.com", subject: "AI \uC77C\uC77C \uB274\uC2A4\uB808\uD130" }, status: "idle" as NodeStatus },
    ] as FlowNode[],
    edges: [{ id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" }] as FlowEdge[],
  },
  {
    name: "\uC6F9\uD6C5 \u2192 AI \u2192 Slack",
    nodes: [
      { id: "n1", type: "trigger" as NodeType, label: "Webhook \uC218\uC2E0", x: 80,  y: 200, config: { path: "/api/flow/webhook" }, status: "idle" as NodeStatus },
      { id: "n2", type: "ai"      as NodeType, label: "\uB370\uC774\uD130 \uBD84\uC11D",  x: 320, y: 200, config: { model: "gpt-4o", prompt: "\uC218\uC2E0\uB41C \uB370\uC774\uD130\uB97C \uD55C\uAD6D\uC5B4\uB85C \uC694\uC57D\uD574\uC8FC\uC138\uC694." }, status: "idle" as NodeStatus },
      { id: "n3", type: "http"    as NodeType, label: "Slack \uBC1C\uC1A1",  x: 560, y: 200, config: { url: "https://hooks.slack.com/...", method: "POST" }, status: "idle" as NodeStatus },
    ] as FlowNode[],
    edges: [{ id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" }] as FlowEdge[],
  },
];

let nodeCounter = 10;

function genId() { return `n${nodeCounter++}`; }

/* ── Status border color helper ──────────────────────────────────────────── */
function statusBorderColor(status: NodeStatus, nodeColor: string, isSelected: boolean): string {
  switch (status) {
    case "running": return T.blue;
    case "done":    return T.green;
    case "error":   return T.red;
    case "skipped": return T.muted;
    default:        return isSelected ? nodeColor : "rgba(255,255,255,0.1)";
  }
}

function statusGlow(status: NodeStatus): string {
  switch (status) {
    case "running": return `0 0 20px ${T.blue}60`;
    case "done":    return `0 0 16px ${T.green}40`;
    case "error":   return `0 0 16px ${T.red}40`;
    default:        return "0 4px 20px rgba(0,0,0,0.4)";
  }
}

function FlowNodeCard({ node, selected, onSelect, onDelete, offset }: {
  node:     FlowNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  offset:   { x: number; y: number };
}) {
  const color = NODE_COLORS[node.type];
  const borderColor = statusBorderColor(node.status, color, selected);
  const shadow = node.status !== "idle" ? statusGlow(node.status) : selected ? `0 0 20px ${color}40` : "0 4px 20px rgba(0,0,0,0.4)";

  return (
    <div
      onClick={onSelect}
      style={{
        position: "absolute",
        left: node.x + offset.x,
        top:  node.y + offset.y,
        width: 180,
        background: T.card,
        border: `2px solid ${borderColor}`,
        borderRadius: 14,
        cursor: "pointer",
        boxShadow: shadow,
        transition: "border-color 0.3s, box-shadow 0.3s",
        userSelect: "none",
      }}
    >
      {/* Status bar */}
      <div style={{
        height: 3,
        borderRadius: "12px 12px 0 0",
        background: node.status === "running" ? T.blue
          : node.status === "done" ? T.green
          : node.status === "error" ? T.red
          : node.status === "skipped" ? T.muted
          : "transparent",
        transition: "background 0.3s",
      }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color, flexShrink: 0 }}>
            {NODE_ICONS[node.type]}
          </span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>{node.label}</div>
            <div style={{ fontSize: 10, color }}>{node.type}</div>
          </div>
          <button
            aria-label="노드 삭제"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(248,113,113,0.2)", color: T.red, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >&times;</button>
        </div>
        {node.status === "done" && node.output && (
          <div style={{ fontSize: 10, color: T.green, background: "rgba(34,197,94,0.08)", padding: "4px 6px", borderRadius: 6, marginTop: 6, wordBreak: "break-all", maxHeight: 40, overflow: "hidden" }}>
            {node.output.slice(0, 80)}{node.output.length > 80 ? "..." : ""}
          </div>
        )}
        {node.status === "error" && node.output && (
          <div style={{ fontSize: 10, color: T.red, background: "rgba(248,113,113,0.08)", padding: "4px 6px", borderRadius: 6, marginTop: 6, wordBreak: "break-all", maxHeight: 40, overflow: "hidden" }}>
            {node.output.slice(0, 80)}{node.output.length > 80 ? "..." : ""}
          </div>
        )}
        {node.status === "running" && (
          <div style={{ fontSize: 10, color: T.blue, marginTop: 6 }}>
            <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>&#9679;</span> \uC2E4\uD589 \uC911...
          </div>
        )}
        {node.status === "skipped" && (
          <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>\uAC74\uB108\uB6F0</div>
        )}
      </div>
      {/* Input/Output ports */}
      <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: T.card, border: `2px solid ${color}`, zIndex: 1 }} />
      <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: color, zIndex: 1 }} />
    </div>
  );
}

/* ── Execution Results Panel ─────────────────────────────────────────────── */

function ExecutionResultsPanel({
  results,
  nodes,
  totalDuration,
  onClose,
}: {
  results: FlowExecutionResult[];
  nodes: FlowNode[];
  totalDuration: number;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount   = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: 280,
      background: T.surface,
      borderTop: `2px solid ${errorCount > 0 ? T.red : T.green}`,
      display: "flex",
      flexDirection: "column",
      zIndex: 10,
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>\uC2E4\uD589 \uACB0\uACFC</span>
          <span style={{ fontSize: 11, color: T.green }}>{successCount} \uC131\uACF5</span>
          {errorCount > 0 && <span style={{ fontSize: 11, color: T.red }}>{errorCount} \uC624\uB958</span>}
          {skippedCount > 0 && <span style={{ fontSize: 11, color: T.muted }}>{skippedCount} \uAC74\uB108\uB6F0</span>}
          <span style={{ fontSize: 11, color: T.muted }}>{totalDuration}ms</span>
        </div>
        <button aria-label="실행 결과 닫기" onClick={onClose} style={{
          background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14,
        }}>&times;</button>
      </div>

      {/* Results list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {results.map(result => {
          const node = nodes.find(n => n.id === result.nodeId);
          const isExpanded = expanded === result.nodeId;
          const statusIcon = result.status === 'success' ? '\u2713' : result.status === 'error' ? '\u2717' : '\u2014';
          const statusColor = result.status === 'success' ? T.green : result.status === 'error' ? T.red : T.muted;

          return (
            <div key={result.nodeId}>
              <div
                onClick={() => setExpanded(isExpanded ? null : result.nodeId)}
                style={{
                  padding: "6px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background 0.15s",
                }}
              >
                <span style={{ color: statusColor, fontSize: 13, fontWeight: 700, width: 16, textAlign: "center" }}>{statusIcon}</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600, minWidth: 100 }}>
                  {node?.label ?? result.nodeId}
                </span>
                <span style={{ fontSize: 11, color: T.muted }}>{node?.type ?? ''}</span>
                <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>{result.duration}ms</span>
                {result.error && (
                  <span style={{ fontSize: 10, color: T.red, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {result.error}
                  </span>
                )}
                <span style={{ fontSize: 10, color: T.muted }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </div>
              {isExpanded && (
                <div style={{
                  padding: "8px 16px 8px 42px",
                  background: "rgba(0,0,0,0.2)",
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: "monospace",
                    fontSize: 11,
                    color: T.text,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    maxHeight: 140,
                    overflow: "auto",
                  }}>
                    {JSON.stringify(result.output, null, 2) ?? 'null'}
                  </pre>
                  {result.error && (
                    <div style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{result.error}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function DalkkakFlowPage() {
  const [nodes,    setNodes]    = useState<FlowNode[]>([]);
  const [edges,    setEdges]    = useState<FlowEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [running,  setRunning]  = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [execResults, setExecResults] = useState<FlowRunResult | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };
  const isMobile = useMediaQuery("(max-width: 767px)");
  const canvasRef  = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(n => n.id === selected);

  const addNode = (type: NodeType) => {
    const node: FlowNode = {
      id:     genId(),
      type,
      label:  NODE_TYPES.find(t => t.type === type)?.label ?? type,
      x:      200 + Math.random() * 200,
      y:      150 + Math.random() * 100,
      config: {},
      status: "idle",
    };
    setNodes(prev => [...prev, node]);
    setSelected(node.id);
  };

  const loadTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setNodes(tmpl.nodes);
    setEdges(tmpl.edges);
    setSelected(null);
    setLogLines([]);
    setExecResults(null);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selected === id) setSelected(null);
  };

  const updateConfig = (key: string, value: string) => {
    setNodes(prev => prev.map(n => n.id === selected ? { ...n, config: { ...n.config, [key]: value } } : n));
  };

  /* ── Run flow via real API ───────────────────────────────────────────── */
  const NODE_TIMEOUT_MS = 30_000;

  const runFlow = useCallback(async () => {
    if (running || nodes.length === 0) return;
    setRunning(true);
    setExecResults(null);

    // Task 2: Add visible separator when previous log exists, then start fresh header
    setLogLines(prev => [
      ...(prev.length > 0 ? [...prev, "── 새 실행 ──"] : []),
      "\uD83D\uDE80 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2E4\uD589 \uC2DC\uC791...",
    ]);

    // Reset all nodes to idle
    setNodes(prev => prev.map(n => ({ ...n, status: "idle" as NodeStatus, output: undefined })));

    // Mark all nodes as "running" for visual feedback
    setNodes(prev => prev.map(n => ({ ...n, status: "running" as NodeStatus })));

    // Build API payload: map page types to API types
    const apiNodes = nodes.map(n => ({
      id:       n.id,
      type:     PAGE_TO_API_TYPE[n.type],
      label:    n.label,
      config:   n.config as Record<string, unknown>,
      position: { x: n.x, y: n.y },
    }));

    const apiEdges = edges.map(e => ({
      id:     e.id,
      source: e.from,
      target: e.to,
    }));

    try {
      setLogLines(prev => [...prev, "\u25B6 API \uD638\uCD9C \uC911: POST /api/flow/execute"]);

      // Task 1: AbortController with 30-second timeout per node
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NODE_TIMEOUT_MS * Math.max(nodes.length, 1),
      );

      let res: Response;
      try {
        res = await fetch('/api/flow/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: apiNodes, edges: apiEdges }),
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof DOMException && fetchErr.name === 'AbortError') {
          const timeoutMsg = `실행 시간 초과 (${NODE_TIMEOUT_MS / 1000}초)`;
          setLogLines(prev => [...prev, `  \u2717 ${timeoutMsg}`]);
          setNodes(prev => prev.map(n =>
            n.status === "running"
              ? { ...n, status: "error" as NodeStatus, output: timeoutMsg }
              : n
          ));
          setRunning(false);
          return;
        }
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const result: FlowRunResult = await res.json();
      setExecResults(result);

      // Update each node's status and output based on results
      setNodes(prev => prev.map(node => {
        const nodeResult = result.results.find(r => r.nodeId === node.id);
        if (!nodeResult) return { ...node, status: "idle" as NodeStatus };

        let output: string | undefined;
        if (nodeResult.output !== null && nodeResult.output !== undefined) {
          output = typeof nodeResult.output === 'string'
            ? nodeResult.output
            : JSON.stringify(nodeResult.output);
        }
        if (nodeResult.error) {
          output = nodeResult.error;
        }

        const statusMap: Record<string, NodeStatus> = {
          success: "done",
          error:   "error",
          skipped: "skipped",
        };

        return {
          ...node,
          status: statusMap[nodeResult.status] ?? "idle",
          output,
        };
      }));

      // Build log lines from results
      const newLogLines: string[] = [];
      for (const r of result.results) {
        const node = nodes.find(n => n.id === r.nodeId);
        const label = node?.label ?? r.nodeId;
        if (r.status === 'success') {
          const summary = typeof r.output === 'object' && r.output !== null
            ? JSON.stringify(r.output).slice(0, 80)
            : String(r.output ?? '').slice(0, 80);
          newLogLines.push(`  \u2713 ${label}: ${summary} (${r.duration}ms)`);
        } else if (r.status === 'error') {
          newLogLines.push(`  \u2717 ${label}: ${r.error ?? '\uC624\uB958 \uBC1C\uC0DD'} (${r.duration}ms)`);
        } else {
          newLogLines.push(`  \u2014 ${label}: \uAC74\uB108\uB6F0`);
        }
      }

      setLogLines(prev => [
        ...prev,
        ...newLogLines,
        result.success
          ? `\u2705 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC644\uB8CC! (\uCD1D ${result.totalDuration}ms)`
          : `\u274C \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC2E4\uD328 (\uCD1D ${result.totalDuration}ms)`,
      ]);
      if (!result.success) {
        showToast("플로우 실행 중 일부 노드에서 오류가 발생했습니다");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setLogLines(prev => [...prev, `  \u2717 \uC2E4\uD589 \uC624\uB958: ${msg}`]);
      showToast("플로우 실행 중 오류가 발생했습니다");
      // Mark all running nodes as error
      setNodes(prev => prev.map(n =>
        n.status === "running" ? { ...n, status: "error" as NodeStatus, output: msg } : n
      ));
    } finally {
      setRunning(false);
    }
  }, [nodes, edges, running]);

  // Drag to move canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
  };

  const configFields: Record<NodeType, { key: string; label: string; placeholder: string }[]> = {
    trigger:   [{ key: "cron", label: "\uC2A4\uCF00\uC904 (Cron)", placeholder: "0 9 * * *" }, { key: "path", label: "Webhook \uACBD\uB85C", placeholder: "/api/webhook" }],
    ai:        [{ key: "model", label: "\uBAA8\uB378", placeholder: "claude-sonnet-4-6" }, { key: "prompt", label: "\uD504\uB86C\uD504\uD2B8", placeholder: "\uC5ED\uD560\uACFC \uD560 \uC77C\uC744 \uC785\uB825\uD558\uC138\uC694..." }],
    http:      [{ key: "url", label: "URL", placeholder: "https://api.example.com" }, { key: "method", label: "\uBA54\uC11C\uB4DC", placeholder: "POST" }, { key: "body", label: "\uC694\uCCAD \uBCF8\uBB38 (JSON)", placeholder: '{"key": "value"}' }],
    condition: [{ key: "field", label: "\uBE44\uAD50 \uD544\uB4DC", placeholder: "prev.status" }, { key: "operator", label: "\uC5F0\uC0B0\uC790", placeholder: "== | != | > | < | contains" }, { key: "value", label: "\uBE44\uAD50\uAC12", placeholder: "200" }],
    email:     [{ key: "to", label: "\uC218\uC2E0\uC790", placeholder: "user@example.com" }, { key: "subject", label: "\uC81C\uBAA9", placeholder: "\uC54C\uB9BC" }, { key: "body", label: "\uBCF8\uBB38", placeholder: "\uBA54\uC2DC\uC9C0 \uB0B4\uC6A9... {{prev.text}} \uC0AC\uC6A9 \uAC00\uB2A5" }],
    code:      [{ key: "template", label: "\uBCC0\uD658 \uD15C\uD50C\uB9BF", placeholder: '{"result": "{{prev.text}}"}' }],
    output:    [{ key: "template", label: "\uCD9C\uB825 \uD15C\uD50C\uB9BF", placeholder: "{{prev}}" }],
  };

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', overflow: "hidden", position: "relative" }}>

        {/* Pulse animation for running indicator */}
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>

        {/* Mobile palette backdrop */}
        {isMobile && paletteOpen && (
          <div
            aria-hidden="true"
            onClick={() => setPaletteOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 20 }}
          />
        )}

        {/* -- Left: Node palette -- */}
        <div aria-label="노드 추가" style={{
          width: 220, background: T.surface, borderRight: `1px solid ${T.border}`,
          display: isMobile && !paletteOpen ? "none" : "flex",
          flexDirection: "column", flexShrink: 0,
          ...(isMobile ? {
            position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 21,
            boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
          } : {}),
        }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>Dalkak Flow</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>AI \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uBE4C\uB354</div>
          </div>

          {/* Templates */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>\uD15C\uD50C\uB9BF</div>
            {TEMPLATES.map(tmpl => (
              <button key={tmpl.name} aria-label={`${tmpl.name} 템플릿 불러오기`} onClick={() => loadTemplate(tmpl)} style={{
                display: "block", width: "100%", textAlign: "left", padding: "7px 10px",
                marginBottom: 4, borderRadius: 8, border: `1px solid ${T.border}`,
                background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Node types */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>\uB178\uB4DC \uCD94\uAC00</div>
            {NODE_TYPES.map(({ type, label, desc }) => (
              <button key={type} aria-label={`${label} 노드 추가`} onClick={() => addNode(type)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "8px 10px", marginBottom: 4, borderRadius: 8,
                border: `1px solid ${T.border}`, background: "transparent", cursor: "pointer",
                transition: "all 0.15s", textAlign: "left",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${NODE_COLORS[type]}10`; e.currentTarget.style.borderColor = NODE_COLORS[type]; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; }}
              >
                <span style={{ fontSize: 14, width: 22, textAlign: "center", flexShrink: 0 }}>{NODE_ICONS[type]}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.muted }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Run button */}
          <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
            <button aria-label="플로우 실행" onClick={runFlow} disabled={running || nodes.length === 0} style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
              background: running ? "rgba(96,165,250,0.4)" : "linear-gradient(135deg, #f97316, #f43f5e)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: running ? "default" : "pointer",
              transition: "background 0.3s",
            }}>
              {running ? "\u23F3 \uC2E4\uD589 \uC911..." : "\u25B6 Run"}
            </button>
          </div>
        </div>

        {/* -- Center: Canvas -- */}
        <div
          ref={canvasRef}
          role="application" aria-label="플로우 편집기"
          style={{ flex: 1, position: "relative", overflow: isMobile ? "auto" : "hidden", background: `radial-gradient(circle at 50% 50%, rgba(249,115,22,0.03) 0%, transparent 60%)` }}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Mobile floating toolbar */}
          {isMobile && (
            <div style={{
              position: "absolute", top: 8, left: 8, right: 8, zIndex: 10,
              display: "flex", gap: 6, alignItems: "center",
            }}>
              <button aria-label="노드 팔레트 토글" onClick={() => setPaletteOpen(v => !v)} style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`,
                background: paletteOpen ? T.accent : T.surface, color: paletteOpen ? "#fff" : T.text,
                fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                +
              </button>
              <button aria-label="플로우 실행" onClick={runFlow} disabled={running || nodes.length === 0} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: running ? "rgba(96,165,250,0.4)" : "linear-gradient(135deg, #f97316, #f43f5e)",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: running ? "default" : "pointer",
              }}>
                {running ? "\u23F3 \uC2E4\uD589 \uC911..." : "\u25B6 Run"}
              </button>
              <button aria-label="설정 패널 토글" onClick={() => setConfigPanelOpen(v => !v)} style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`,
                background: configPanelOpen ? T.accent : T.surface, color: configPanelOpen ? "#fff" : T.text,
                fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                ⚙
              </button>
            </div>
          )}

          {/* Grid background */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode   = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              const x1 = fromNode.x + offset.x + 188;
              const y1 = fromNode.y + offset.y + 46;
              const x2 = toNode.x + offset.x - 8;
              const y2 = toNode.y + offset.y + 46;
              const mx = (x1 + x2) / 2;
              const color = NODE_COLORS[fromNode.type];
              const isRunning = fromNode.status === "running" || toNode.status === "running";
              const isDone = fromNode.status === "done" && (toNode.status === "done" || toNode.status === "running");
              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                  fill="none"
                  stroke={isDone ? T.green : isRunning ? T.blue : color}
                  strokeWidth="2"
                  strokeOpacity={isDone ? 0.9 : isRunning ? 0.8 : 0.6}
                  strokeDasharray={isRunning ? "6 3" : "none"}
                />
              );
            })}
          </svg>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>{"\u26A1"}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.muted }}>\uC67C\uCABD\uC5D0\uC11C \uB178\uB4DC\uB97C \uCD94\uAC00\uD558\uAC70\uB098 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uC138\uC694</div>
              <div style={{ fontSize: 12, color: "#374151" }}>\uB4DC\uB798\uADF8\uB85C \uC5F0\uACB0, \uD074\uB9AD\uC73C\uB85C \uC124\uC815</div>
            </div>
          )}

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id} data-node="true">
              <FlowNodeCard
                node={node}
                selected={selected === node.id}
                onSelect={() => setSelected(node.id)}
                onDelete={() => deleteNode(node.id)}
                offset={offset}
              />
            </div>
          ))}

          {/* Execution Results Panel (overlaid at bottom of canvas) */}
          {execResults && (
            <ExecutionResultsPanel
              results={execResults.results}
              nodes={nodes}
              totalDuration={execResults.totalDuration}
              onClose={() => setExecResults(null)}
            />
          )}
        </div>

        {/* Mobile config panel backdrop */}
        {isMobile && configPanelOpen && (
          <div
            aria-hidden="true"
            onClick={() => setConfigPanelOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 20 }}
          />
        )}

        {/* -- Right: Config + Log -- */}
        <div aria-label="노드 설정 및 실행 로그" style={{
          width: isMobile ? "100%" : 280, background: T.surface,
          borderLeft: isMobile ? "none" : `1px solid ${T.border}`,
          display: isMobile && !configPanelOpen ? "none" : "flex",
          flexDirection: "column",
          ...(isMobile ? {
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 21,
            maxHeight: "55vh", borderTop: `2px solid ${T.accent}`,
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          } : {}),
        }}>
          {/* Config */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedNode ? (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>\uB178\uB4DC \uC124\uC815</div>
                <div style={{ fontSize: 11, color: NODE_COLORS[selectedNode.type], marginBottom: 16 }}>{NODE_ICONS[selectedNode.type]} {selectedNode.type}</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>\uC774\uB984</label>
                  <input
                    aria-label="노드 이름"
                    value={selectedNode.label}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {(configFields[selectedNode.type] ?? []).map(field => (
                  <div key={field.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{field.label}</label>
                    {field.key === "template" || field.key === "prompt" || field.key === "body" ? (
                      <textarea
                        aria-label={field.label}
                        value={selectedNode.config[field.key] ?? ""}
                        onChange={e => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    ) : (
                      <input
                        aria-label={field.label}
                        value={selectedNode.config[field.key] ?? ""}
                        onChange={e => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                    )}
                  </div>
                ))}

                {/* Show node execution output if available */}
                {selectedNode.output && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>\uC2E4\uD589 \uACB0\uACFC</label>
                    <pre style={{
                      marginTop: 6,
                      padding: "8px 10px",
                      borderRadius: 7,
                      border: `1px solid ${T.border}`,
                      background: "rgba(0,0,0,0.3)",
                      color: selectedNode.status === "error" ? T.red : T.green,
                      fontSize: 11,
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      maxHeight: 120,
                      overflow: "auto",
                    }}>
                      {selectedNode.output}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 16, color: T.muted, fontSize: 12, textAlign: "center", marginTop: 20 }}>
                \uB178\uB4DC\uB97C \uD074\uB9AD\uD558\uBA74 \uC124\uC815\uC774 \uD45C\uC2DC\uB429\uB2C8\uB2E4
              </div>
            )}
          </div>

          {/* Execution Log */}
          <div style={{ borderTop: `1px solid ${T.border}`, height: 200, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
              \uC2E4\uD589 \uB85C\uADF8
              <button aria-label="실행 로그 지우기" onClick={() => { setLogLines([]); setExecResults(null); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11 }}>\uC9C0\uC6B0\uAE30</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6 }}>
              {logLines.length === 0 ? (
                <div style={{ color: T.muted }}>\uC2E4\uD589 \uB85C\uADF8\uAC00 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4</div>
              ) : logLines.map((line, i) => (
                <div key={i} style={{
                  color: line === "── 새 실행 ──" ? T.yellow
                    : line.includes("\u2713") ? T.green
                    : line.includes("\u2717") ? T.red
                    : line.includes("\u2705") ? T.green
                    : line.includes("\u274C") ? T.red
                    : line.includes("\uD83D\uDE80") ? T.accent
                    : line.includes("\u25B6") ? T.blue
                    : T.muted,
                  ...(line === "── 새 실행 ──" ? {
                    textAlign: "center" as const,
                    borderTop: `1px solid ${T.border}`,
                    borderBottom: `1px solid ${T.border}`,
                    margin: "6px 0",
                    padding: "4px 0",
                    letterSpacing: "0.1em",
                    fontSize: 10,
                  } : {}),
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {toast && <div role="alert" aria-live="polite" style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,0.95)', color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:600, zIndex:99999, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>{toast}</div>}
    </AppShell>
  );
}
