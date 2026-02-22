"use client";
export const dynamic = "force-dynamic";

import { useState, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";

const T = {
  bg:      "#0a0a12",
  surface: "#111118",
  card:    "#16161e",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#f97316",
  text:    "#e2e8f0",
  muted:   "#6b7280",
  green:   "#22c55e",
  blue:    "#60a5fa",
  purple:  "#a855f7",
  red:     "#f87171",
  yellow:  "#fbbf24",
};

type NodeType = "trigger" | "ai" | "http" | "condition" | "email" | "code" | "output";
type NodeStatus = "idle" | "running" | "done" | "error";

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
  trigger:   "⚡",
  ai:        "🤖",
  http:      "🌐",
  condition: "🔀",
  email:     "📧",
  code:      "</>",
  output:    "📤",
};

const NODE_TYPES: { type: NodeType; label: string; desc: string }[] = [
  { type: "trigger",   label: "트리거",    desc: "워크플로우 시작점" },
  { type: "ai",        label: "AI 노드",   desc: "GPT, Claude, Gemini 호출" },
  { type: "http",      label: "HTTP",      desc: "REST API 호출" },
  { type: "condition", label: "조건",      desc: "분기 처리" },
  { type: "email",     label: "이메일",    desc: "이메일 전송" },
  { type: "code",      label: "코드",      desc: "JavaScript 실행" },
  { type: "output",    label: "출력",      desc: "결과 저장" },
];

const TEMPLATES = [
  {
    name: "AI 콘텐츠 생성",
    nodes: [
      { id: "n1", type: "trigger" as NodeType, label: "매일 09:00", x: 80,  y: 200, config: { cron: "0 9 * * *" }, status: "idle" as NodeStatus },
      { id: "n2", type: "ai"      as NodeType, label: "블로그 초안", x: 320, y: 200, config: { model: "claude-sonnet-4-6", prompt: "오늘의 AI 트렌드 블로그 포스트를 500자로 작성해주세요." }, status: "idle" as NodeStatus },
      { id: "n3", type: "email"   as NodeType, label: "이메일 발송", x: 560, y: 200, config: { to: "team@company.com", subject: "AI 일일 뉴스레터" }, status: "idle" as NodeStatus },
    ] as FlowNode[],
    edges: [{ id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" }] as FlowEdge[],
  },
  {
    name: "웹훅 → AI → Slack",
    nodes: [
      { id: "n1", type: "trigger" as NodeType, label: "Webhook 수신", x: 80,  y: 200, config: { path: "/api/flow/webhook" }, status: "idle" as NodeStatus },
      { id: "n2", type: "ai"      as NodeType, label: "데이터 분석",  x: 320, y: 200, config: { model: "gpt-4o", prompt: "수신된 데이터를 한국어로 요약해주세요." }, status: "idle" as NodeStatus },
      { id: "n3", type: "http"    as NodeType, label: "Slack 발송",  x: 560, y: 200, config: { url: "https://hooks.slack.com/...", method: "POST" }, status: "idle" as NodeStatus },
    ] as FlowNode[],
    edges: [{ id: "e1", from: "n1", to: "n2" }, { id: "e2", from: "n2", to: "n3" }] as FlowEdge[],
  },
];

let nodeCounter = 10;

function genId() { return `n${nodeCounter++}`; }

function FlowNodeCard({ node, selected, onSelect, onDelete, offset }: {
  node:     FlowNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  offset:   { x: number; y: number };
}) {
  const color = NODE_COLORS[node.type];
  const statusColor = node.status === "running" ? T.yellow : node.status === "done" ? T.green : node.status === "error" ? T.red : "transparent";

  return (
    <div
      onClick={onSelect}
      style={{
        position: "absolute",
        left: node.x + offset.x,
        top:  node.y + offset.y,
        width: 180,
        background: T.card,
        border: `2px solid ${selected ? color : "rgba(255,255,255,0.1)"}`,
        borderRadius: 14,
        cursor: "pointer",
        boxShadow: selected ? `0 0 20px ${color}40` : "0 4px 20px rgba(0,0,0,0.4)",
        transition: "border-color 0.15s, box-shadow 0.15s",
        userSelect: "none",
      }}
    >
      {/* Status bar */}
      <div style={{ height: 3, borderRadius: "12px 12px 0 0", background: statusColor, transition: "background 0.3s" }} />
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
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: "none", background: "rgba(248,113,113,0.2)", color: T.red, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >×</button>
        </div>
        {node.status === "done" && node.output && (
          <div style={{ fontSize: 10, color: T.green, background: "rgba(34,197,94,0.08)", padding: "4px 6px", borderRadius: 6, marginTop: 6, wordBreak: "break-all", maxHeight: 40, overflow: "hidden" }}>
            ✓ {node.output.slice(0, 60)}{node.output.length > 60 ? "..." : ""}
          </div>
        )}
        {node.status === "running" && (
          <div style={{ fontSize: 10, color: T.yellow, marginTop: 6 }}>실행 중...</div>
        )}
      </div>
      {/* Input/Output ports */}
      <div style={{ position: "absolute", left: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: T.card, border: `2px solid ${color}`, zIndex: 1 }} />
      <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: color, zIndex: 1 }} />
    </div>
  );
}

export default function DalkkakFlowPage() {
  const [nodes,    setNodes]    = useState<FlowNode[]>([]);
  const [edges,    setEdges]    = useState<FlowEdge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [running,  setRunning]  = useState(false);
  const [log,      setLog]      = useState<string[]>([]);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ nodeId: string; startX: number; startY: number } | null>(null);
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
    setLog([]);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    if (selected === id) setSelected(null);
  };

  const updateConfig = (key: string, value: string) => {
    setNodes(prev => prev.map(n => n.id === selected ? { ...n, config: { ...n.config, [key]: value } } : n));
  };

  const runFlow = useCallback(async () => {
    if (running || nodes.length === 0) return;
    setRunning(true);
    setLog(["🚀 워크플로우 실행 시작..."]);

    // Reset all nodes
    setNodes(prev => prev.map(n => ({ ...n, status: "idle", output: undefined })));

    // Execute nodes in order (simplified topological sort)
    const ordered: FlowNode[] = [];
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const incomers = edges.filter(e => e.to === id).map(e => e.from);
      incomers.forEach(visit);
      const node = nodes.find(n => n.id === id);
      if (node) ordered.push(node);
    };
    nodes.forEach(n => visit(n.id));

    for (const node of ordered) {
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: "running" } : n));
      setLog(prev => [...prev, `▶ ${node.label} (${node.type}) 실행 중...`]);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

      let output = "";
      try {
        if (node.type === "ai") {
          output = `[AI] "${node.config.prompt?.slice(0, 40) ?? "..."}" 처리 완료`;
        } else if (node.type === "http") {
          output = `[HTTP] ${node.config.url ?? "URL"} → 200 OK`;
        } else if (node.type === "email") {
          output = `[이메일] ${node.config.to ?? "recipient"} 발송 완료`;
        } else if (node.type === "trigger") {
          output = `[트리거] ${node.config.cron ?? node.config.path ?? "수동 실행"} 완료`;
        } else if (node.type === "code") {
          output = `[코드] 실행 완료`;
        } else {
          output = "실행 완료";
        }
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: "done", output } : n));
        setLog(prev => [...prev, `  ✓ ${node.label}: ${output}`]);
      } catch {
        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, status: "error" } : n));
        setLog(prev => [...prev, `  ✗ ${node.label}: 오류 발생`]);
      }
    }

    setLog(prev => [...prev, "✅ 워크플로우 완료!"]);
    setRunning(false);
  }, [nodes, edges, running]);

  // Drag to move canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
  };

  const configFields: Record<NodeType, { key: string; label: string; placeholder: string }[]> = {
    trigger:   [{ key: "cron", label: "스케줄 (Cron)", placeholder: "0 9 * * *" }, { key: "path", label: "Webhook 경로", placeholder: "/api/webhook" }],
    ai:        [{ key: "model", label: "모델", placeholder: "claude-sonnet-4-6" }, { key: "prompt", label: "프롬프트", placeholder: "역할과 할 일을 입력하세요..." }],
    http:      [{ key: "url", label: "URL", placeholder: "https://api.example.com" }, { key: "method", label: "메서드", placeholder: "POST" }, { key: "body", label: "요청 본문 (JSON)", placeholder: '{"key": "value"}' }],
    condition: [{ key: "field", label: "비교 필드", placeholder: "$.status" }, { key: "operator", label: "연산자", placeholder: "equals" }, { key: "value", label: "비교값", placeholder: "200" }],
    email:     [{ key: "to", label: "수신자", placeholder: "user@example.com" }, { key: "subject", label: "제목", placeholder: "알림" }, { key: "body", label: "본문", placeholder: "메시지 내용..." }],
    code:      [{ key: "code", label: "JavaScript", placeholder: "return { result: input.data };" }],
    output:    [{ key: "format", label: "형식", placeholder: "json | text | csv" }],
  };

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', overflow: "hidden" }}>

        {/* ── Left: Node palette ── */}
        <div style={{ width: 220, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>Dalkak Flow</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>AI 워크플로우 빌더</div>
          </div>

          {/* Templates */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>템플릿</div>
            {TEMPLATES.map(tmpl => (
              <button key={tmpl.name} onClick={() => loadTemplate(tmpl)} style={{
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
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>노드 추가</div>
            {NODE_TYPES.map(({ type, label, desc }) => (
              <button key={type} onClick={() => addNode(type)} style={{
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
            <button onClick={runFlow} disabled={running || nodes.length === 0} style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
              background: running ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #f43f5e)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: running ? "default" : "pointer",
            }}>
              {running ? "실행 중..." : "▶ 실행"}
            </button>
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div
          ref={canvasRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", background: `radial-gradient(circle at 50% 50%, rgba(249,115,22,0.03) 0%, transparent 60%)` }}
          onMouseDown={handleCanvasMouseDown}
        >
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
              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeOpacity={0.6}
                  strokeDasharray={fromNode.status === "running" ? "6 3" : "none"}
                />
              );
            })}
          </svg>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.2 }}>⚡</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.muted }}>왼쪽에서 노드를 추가하거나 템플릿을 선택하세요</div>
              <div style={{ fontSize: 12, color: "#374151" }}>드래그로 연결, 클릭으로 설정</div>
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
        </div>

        {/* ── Right: Config + Log ── */}
        <div style={{ width: 280, background: T.surface, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
          {/* Config */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedNode ? (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>노드 설정</div>
                <div style={{ fontSize: 11, color: NODE_COLORS[selectedNode.type], marginBottom: 16 }}>{NODE_ICONS[selectedNode.type]} {selectedNode.type}</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>이름</label>
                  <input
                    value={selectedNode.label}
                    onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                    style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {(configFields[selectedNode.type] ?? []).map(field => (
                  <div key={field.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{field.label}</label>
                    {field.key === "code" || field.key === "prompt" || field.key === "body" ? (
                      <textarea
                        value={selectedNode.config[field.key] ?? ""}
                        onChange={e => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={4}
                        style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    ) : (
                      <input
                        value={selectedNode.config[field.key] ?? ""}
                        onChange={e => updateConfig(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16, color: T.muted, fontSize: 12, textAlign: "center", marginTop: 20 }}>
                노드를 클릭하면 설정이 표시됩니다
              </div>
            )}
          </div>

          {/* Execution Log */}
          <div style={{ borderTop: `1px solid ${T.border}`, height: 200, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", justifyContent: "space-between" }}>
              실행 로그
              <button onClick={() => setLog([])} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11 }}>지우기</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6 }}>
              {log.length === 0 ? (
                <div style={{ color: T.muted }}>실행 로그가 여기에 표시됩니다</div>
              ) : log.map((line, i) => (
                <div key={i} style={{ color: line.includes("✓") ? T.green : line.includes("✗") ? T.red : line.includes("✅") ? T.green : line.includes("🚀") ? T.accent : T.muted }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
