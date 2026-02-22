"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/utils/supabase/client";

const PRESENCE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f43f5e", "#14b8a6"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Doc = { id: number; title: string; emoji: string; updatedAt: string; author: string };
type Comment = { id: number; author: string; color: string; text: string; time: string };
type OnlineUser = { id: number; name: string; color: string; initial: string; cursor: string };
type AiMode = "openai" | "anthropic" | "gemini";

// ─── AI 에이전트 정의 (LM 설정 포함) ─────────────────────────────────────────

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  description: string;
  defaultModel: AiMode;
  temperature: number; // 0~1 (표시용)
  systemPrompt: (docSnippet: string) => string;
  promptSuggestions: string[];
}

const AGENTS: AgentConfig[] = [
  {
    id: "writer",
    name: "라이터",
    emoji: "✍️",
    color: "#f97316",
    role: "문서 작성 전문가",
    description: "구조적이고 설득력 있는 글을 작성합니다",
    defaultModel: "anthropic",
    temperature: 0.7,
    systemPrompt: (doc) =>
      `당신은 전문 테크니컬 라이터입니다. 명확하고 간결하며 설득력 있는 문서를 한국어로 작성합니다.
현재 문서 컨텍스트:
${doc}
---
규칙: 마크다운 형식 사용, 제목/소제목/체크리스트/표를 적극 활용. 실용적이고 행동 지향적으로 작성.`,
    promptSuggestions: ["경쟁사 분석 섹션 추가", "실행 계획을 표로 정리", "요약 섹션 맨 앞에 추가", "FAQ 섹션 만들기"],
  },
  {
    id: "coder",
    name: "코더",
    emoji: "💻",
    color: "#3b82f6",
    role: "시니어 개발자",
    description: "기술 설계, 코드 리뷰, 아키텍처 문서화",
    defaultModel: "openai",
    temperature: 0.3,
    systemPrompt: (doc) =>
      `당신은 Next.js/TypeScript/React 전문 시니어 개발자입니다. 정확하고 실행 가능한 기술 문서를 작성합니다.
현재 문서 컨텍스트:
${doc}
---
규칙: 코드 블록에는 반드시 언어 지정. 보안/성능/확장성 측면을 항상 고려. 한국어로 설명, 코드는 영어.`,
    promptSuggestions: ["API 엔드포인트 명세 추가", "ERD 다이어그램 텍스트로 작성", "코드 예시 추가", "성능 최적화 방안 제안"],
  },
  {
    id: "analyst",
    name: "애널리스트",
    emoji: "📊",
    color: "#8b5cf6",
    role: "비즈니스 분석가",
    description: "데이터 기반 인사이트와 시장 분석",
    defaultModel: "openai",
    temperature: 0.5,
    systemPrompt: (doc) =>
      `당신은 McKinsey 출신 비즈니스 애널리스트입니다. 데이터와 근거 중심으로 분석합니다.
현재 문서 컨텍스트:
${doc}
---
규칙: MECE 원칙 적용, 숫자와 비율로 표현, 결론을 먼저 제시 (BLUF 방식). 한국어로 작성.`,
    promptSuggestions: ["SWOT 분석 추가", "시장 규모 추정 섹션", "KPI 지표 정의", "리스크 매트릭스 작성"],
  },
  {
    id: "planner",
    name: "플래너",
    emoji: "🗓️",
    color: "#22c55e",
    role: "프로젝트 매니저",
    description: "일정, 마일스톤, 업무 분배 최적화",
    defaultModel: "gemini",
    temperature: 0.4,
    systemPrompt: (doc) =>
      `당신은 경험 많은 프로젝트 매니저입니다. 현실적이고 실행 가능한 계획을 수립합니다.
현재 문서 컨텍스트:
${doc}
---
규칙: 체크리스트와 타임라인 표 형식 선호, 담당자/마감일/우선순위 명시, 의존성 관계 표시. 한국어로 작성.`,
    promptSuggestions: ["스프린트 계획 2주 단위로", "업무 우선순위 MoSCoW 분류", "마일스톤 로드맵 표", "리소스 배분 계획"],
  },
  {
    id: "reviewer",
    name: "리뷰어",
    emoji: "🔍",
    color: "#f43f5e",
    role: "문서 품질 검토자",
    description: "논리적 오류, 빠진 내용, 개선점 찾기",
    defaultModel: "anthropic",
    temperature: 0.6,
    systemPrompt: (doc) =>
      `당신은 엄격하고 꼼꼼한 시니어 에디터입니다. 문서의 품질을 높이기 위해 비판적으로 검토합니다.
현재 문서:
${doc}
---
규칙: 구체적인 개선점 번호 매겨 나열, 빠진 내용/논리적 오류/불명확한 표현 지적, 개선 예시 제시. 한국어로 작성.`,
    promptSuggestions: ["전체 문서 품질 검토", "논리 흐름 체크", "독자 관점에서 피드백", "목차와 구조 개선안"],
  },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  { id: 1, title: "FieldNine 제품 로드맵", emoji: "🗺️", updatedAt: "방금 전", author: "나" },
  { id: 2, title: "API 설계 문서", emoji: "📐", updatedAt: "1시간 전", author: "김민준" },
  { id: 3, title: "팀 규칙 & 문화", emoji: "🌱", updatedAt: "어제", author: "이서연" },
  { id: 4, title: "마케팅 전략 Q1", emoji: "📣", updatedAt: "2일 전", author: "박지호" },
];

const ONLINE_USERS: OnlineUser[] = [
  { id: 1, name: "나 (You)", color: "#f97316", initial: "나", cursor: "편집 중" },
  { id: 2, name: "김민준", color: "#3b82f6", initial: "김", cursor: "보는 중" },
  { id: 3, name: "이서연", color: "#8b5cf6", initial: "이", cursor: "편집 중" },
];

const INIT_COMMENTS: Comment[] = [
  { id: 1, author: "김민준", color: "#3b82f6", text: "로드맵에 '모바일 앱' 항목도 추가하면 어떨까요?", time: "10:32" },
  { id: 2, author: "이서연", color: "#8b5cf6", text: "디자인 시스템 문서 링크 추가 부탁드려요!", time: "10:45" },
];

const DOC_TEMPLATES = [
  { emoji: "📋", label: "회의록" },
  { emoji: "🗺️", label: "로드맵" },
  { emoji: "📐", label: "기술 설계" },
  { emoji: "📣", label: "마케팅" },
];

const DEFAULT_CONTENT = `# FieldNine 제품 로드맵

## 2026년 1분기 목표

- [ ] AI 코드 생성 기능 출시
- [ ] 팀 협업 채팅 고도화
- [ ] 클라우드 스토리지 100GB 지원
- [ ] 모바일 반응형 완성

## 기술 스택

- **프론트엔드**: Next.js 16, React 18, Stitches
- **백엔드**: Next.js API Routes, Supabase
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini

## 일정

| 기능 | 담당자 | 마감 |
|------|--------|------|
| AI 채팅 | 김민준 | 2/28 |
| 파일 업로드 | 박지호 | 3/10 |
| 디자인 시스템 | 이서연 | 3/15 |`;

const STORAGE_KEY = "cowork_doc_content";
// ─── Component ────────────────────────────────────────────────────────────────

export default function CoWorkPage() {
  const [activeDocId, setActiveDocId]       = useState(1);
  const [docContent, setDocContent]         = useState(DEFAULT_CONTENT);
  const [comments, setComments]             = useState<Comment[]>(INIT_COMMENTS);
  const [commentInput, setCommentInput]     = useState("");
  const [saved, setSaved]                   = useState(false);
  const [onlineUsers, setOnlineUsers]       = useState<OnlineUser[]>([ONLINE_USERS[0]]);

  // AI 에이전트 상태
  const [activeAgent, setActiveAgent]       = useState<AgentConfig>(AGENTS[0]);
  const [aiModel, setAiModel]               = useState<AiMode>(AGENTS[0].defaultModel);
  const [aiPrompt, setAiPrompt]             = useState("");
  const [aiLoading, setAiLoading]           = useState(false);
  const [aiResult, setAiResult]             = useState("");
  const [aiHistory, setAiHistory]           = useState<Array<{agent: string; prompt: string; result: string; time: string}>>([]);
  const [showHistory, setShowHistory]       = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);

  // Realtime refs
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myId           = useRef(`u_${Date.now()}`);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const cursorPos      = useRef<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${activeDocId}`);
    setDocContent(stored || DEFAULT_CONTENT);
    setAiResult("");
    setAiHistory([]);
  }, [activeDocId]);

  useEffect(() => {
    setAiModel(activeAgent.defaultModel);
    setAiPrompt("");
    setAiResult("");
  }, [activeAgent]);

  // Supabase Realtime
  useEffect(() => {
    const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co";
    if (!isConfigured) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase.channel(`cowork_doc_${activeDocId}`, {
      config: { presence: { key: myId.current } },
    });

    channel
      .on("broadcast", { event: "doc_update" }, ({ payload }: { payload: { content: string; sender: string } }) => {
        if (payload.sender === myId.current) return;
        setDocContent(payload.content);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Array<{ name: string }>>;
        const others = Object.entries(state)
          .filter(([key]) => key !== myId.current)
          .map(([, vals], i) => ({
            id: i + 2,
            name: vals[0]?.name ?? "익명",
            color: PRESENCE_COLORS[i % PRESENCE_COLORS.length],
            initial: (vals[0]?.name ?? "익")[0],
            cursor: "보는 중",
          }));
        setOnlineUsers([ONLINE_USERS[0], ...others]);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: "나 (You)", doc_id: activeDocId });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [activeDocId]); // eslint-disable-line

  const handleSave = () => {
    localStorage.setItem(`${STORAGE_KEY}_${activeDocId}`, docContent);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    setComments(prev => [...prev, {
      id: Date.now(),
      author: "나 (You)",
      color: "#f97316",
      text: commentInput.trim(),
      time: now,
    }]);
    setCommentInput("");
  };

  const handleAIWrite = useCallback(async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult("");

    const docSnippet = docContent.slice(0, 600);
    const systemPrompt = activeAgent.systemPrompt(docSnippet);

    try {
      const apiKey = typeof window !== "undefined"
        ? localStorage.getItem(
            aiModel === "openai" ? "OPENAI_API_KEY"
            : aiModel === "anthropic" ? "ANTHROPIC_API_KEY"
            : "GOOGLE_GENERATIVE_AI_API_KEY"
          ) || undefined
        : undefined;

      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${systemPrompt}\n\n사용자 요청: ${aiPrompt}`,
          mode: aiModel,
          apiKey,
        }),
      });

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let text = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                text += parsed.text;
                setAiResult(text);
              } catch { /* skip */ }
            }
          }
        }
      }

      // 히스토리 기록
      if (text) {
        const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        setAiHistory(prev => [{ agent: activeAgent.name, prompt: aiPrompt, result: text, time: now }, ...prev.slice(0, 9)]);
      }
    } catch {
      setAiResult("AI 오류. /settings에서 API 키를 확인하세요.");
    }
    setAiLoading(false);
  }, [aiPrompt, aiLoading, docContent, activeAgent, aiModel]);

  const insertAIContent = () => {
    if (!aiResult) return;
    // 커서 위치에 삽입
    const pos = cursorPos.current || docContent.length;
    const before = docContent.slice(0, pos);
    const after  = docContent.slice(pos);
    setDocContent(before + "\n\n" + aiResult + "\n\n" + after);
    setAiResult("");
    setAiPrompt("");
  };

  const replaceWithAI = () => {
    if (!aiResult) return;
    setDocContent(aiResult);
    setAiResult("");
    setAiPrompt("");
  };

  const activeDoc = DOCS.find(d => d.id === activeDocId) || DOCS[0];

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "#fff" }}>

        {/* ─── Left: Doc List ───────────────────────────── */}
        <div style={{
          width: 200, flexShrink: 0, background: "#f9fafb",
          borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1b1b1f" }}>코워크</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>실시간 AI 협업 문서</div>
          </div>

          {/* Templates */}
          <div style={{ padding: "10px 8px 8px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "0 4px", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              새 문서
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {DOC_TEMPLATES.map(t => (
                <button key={t.label} style={{
                  padding: "5px 4px", borderRadius: 6, border: "1px solid #e5e7eb",
                  background: "#fff", fontSize: 11, cursor: "pointer", color: "#374151",
                  textAlign: "center", fontWeight: 500,
                }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doc list */}
          <div style={{ flex: 1, overflow: "auto", padding: "10px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "0 4px", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              문서
            </div>
            {DOCS.map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                style={{
                  padding: "7px 8px", borderRadius: 7, cursor: "pointer", marginBottom: 3,
                  background: activeDocId === doc.id ? "#fff7ed" : "transparent",
                  border: activeDocId === doc.id ? "1px solid #fed7aa" : "1px solid transparent",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 5, marginBottom: 1,
                  fontSize: 12, fontWeight: activeDocId === doc.id ? 700 : 500,
                  color: activeDocId === doc.id ? "#f97316" : "#1b1b1f",
                }}>
                  <span>{doc.emoji}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{doc.updatedAt} · {doc.author}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Center: Editor ───────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{
            padding: "8px 20px", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>{activeDoc.emoji}</span>
            <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: "#1b1b1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeDoc.title}</div>

            {/* Online users */}
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {onlineUsers.map((u, i) => (
                <div key={u.id} title={`${u.name} · ${u.cursor}`} style={{
                  width: 26, height: 26, borderRadius: "50%", background: u.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  border: "2px solid #fff", marginLeft: i === 0 ? 0 : -5,
                }}>
                  {u.initial}
                </div>
              ))}
              <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>
                {onlineUsers.length}명
              </span>
            </div>

            <button
              onClick={() => setAgentPanelOpen(v => !v)}
              style={{
                padding: "5px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                background: agentPanelOpen ? "#fff7ed" : "#f9fafb",
                color: agentPanelOpen ? "#f97316" : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              }}
            >
              {activeAgent.emoji} {activeAgent.name}
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none",
                background: saved ? "#22c55e" : "#f97316",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s", flexShrink: 0,
              }}
            >
              {saved ? "✅ 저장" : "저장"}
            </button>
          </div>

          {/* Markdown editor */}
          <textarea
            ref={textareaRef}
            value={docContent}
            onChange={e => {
              const content = e.target.value;
              setDocContent(content);
              cursorPos.current = e.target.selectionStart;
              if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
              broadcastTimer.current = setTimeout(() => {
                channelRef.current?.send({
                  type: "broadcast", event: "doc_update",
                  payload: { content, sender: myId.current },
                });
              }, 300);
            }}
            onClick={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart; }}
            spellCheck={false}
            style={{
              flex: 1, width: "100%", padding: "24px 40px",
              border: "none", outline: "none", resize: "none",
              fontSize: 15, lineHeight: 1.85, color: "#1b1b1f",
              fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
              background: "#fff",
            }}
          />
        </div>

        {/* ─── Right: Agent Panel + Comments ─────────────── */}
        {agentPanelOpen && (
          <div style={{
            width: 300, flexShrink: 0, borderLeft: "1px solid #e5e7eb",
            display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff",
          }}>

            {/* Agent Selector */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI 에이전트 선택
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent)}
                    title={agent.description}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid",
                      borderColor: activeAgent.id === agent.id ? agent.color : "#e5e7eb",
                      background: activeAgent.id === agent.id ? agent.color + "15" : "#fff",
                      color: activeAgent.id === agent.id ? agent.color : "#6b7280",
                      fontSize: 11, fontWeight: activeAgent.id === agent.id ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {agent.emoji} {agent.name}
                  </button>
                ))}
              </div>

              {/* Active agent info */}
              <div style={{
                marginTop: 8, padding: "8px 10px", borderRadius: 8,
                background: activeAgent.color + "10", border: `1px solid ${activeAgent.color}30`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: activeAgent.color, marginBottom: 2 }}>
                  {activeAgent.emoji} {activeAgent.name} — {activeAgent.role}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{activeAgent.description}</div>
              </div>
            </div>

            {/* AI Write Panel */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              {/* Model + history toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <select
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value as AiMode)}
                  style={{
                    fontSize: 11, padding: "3px 6px", borderRadius: 5,
                    border: "1px solid #e5e7eb", color: "#374151", background: "#f9fafb",
                  }}
                >
                  <option value="openai">GPT-4o</option>
                  <option value="anthropic">Claude 3.5</option>
                  <option value="gemini">Gemini 1.5</option>
                </select>
                <button
                  onClick={() => setShowHistory(v => !v)}
                  style={{
                    fontSize: 11, color: "#6b7280", background: "none", border: "none",
                    cursor: "pointer", padding: "2px 4px",
                  }}
                >
                  {showHistory ? "▲ 히스토리 닫기" : "▼ 생성 히스토리"}
                </button>
              </div>

              {/* Prompt suggestions */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 7 }}>
                {activeAgent.promptSuggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setAiPrompt(s)}
                    style={{
                      padding: "2px 7px", borderRadius: 10, border: `1px solid ${activeAgent.color}40`,
                      background: activeAgent.color + "08", color: activeAgent.color,
                      fontSize: 10, cursor: "pointer", fontWeight: 500,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Prompt input */}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAIWrite()}
                  placeholder={`${activeAgent.name}에게 요청...`}
                  style={{
                    flex: 1, padding: "7px 10px", borderRadius: 7,
                    border: `1px solid ${activeAgent.color}40`,
                    fontSize: 12, outline: "none", color: "#1b1b1f", background: "#f9fafb",
                  }}
                />
                <button
                  onClick={handleAIWrite}
                  disabled={aiLoading || !aiPrompt.trim()}
                  style={{
                    padding: "7px 12px", borderRadius: 7, border: "none",
                    background: aiLoading || !aiPrompt.trim() ? "#e5e7eb" : activeAgent.color,
                    color: aiLoading || !aiPrompt.trim() ? "#9ca3af" : "#fff",
                    fontSize: 12, fontWeight: 700,
                    cursor: aiLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {aiLoading ? "…" : "→"}
                </button>
              </div>

              {/* AI Result */}
              {aiResult && (
                <div style={{
                  marginTop: 8, padding: "10px 12px",
                  background: activeAgent.color + "08",
                  border: `1px solid ${activeAgent.color}30`,
                  borderRadius: 8, fontSize: 12,
                  color: "#1b1b1f", maxHeight: 160, overflow: "auto",
                  whiteSpace: "pre-wrap", lineHeight: 1.6,
                }}>
                  {aiResult}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button
                      onClick={insertAIContent}
                      style={{
                        flex: 1, padding: "5px 0", borderRadius: 5, border: "none",
                        background: activeAgent.color, color: "#fff",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      + 커서에 삽입
                    </button>
                    <button
                      onClick={replaceWithAI}
                      style={{
                        flex: 1, padding: "5px 0", borderRadius: 5,
                        border: `1px solid ${activeAgent.color}`, color: activeAgent.color,
                        background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      전체 교체
                    </button>
                    <button
                      onClick={() => setAiResult("")}
                      style={{
                        padding: "5px 8px", borderRadius: 5, border: "1px solid #e5e7eb",
                        color: "#9ca3af", background: "#fff", fontSize: 11, cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* History */}
              {showHistory && aiHistory.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>최근 생성 기록</div>
                  {aiHistory.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setAiResult(h.result)}
                      style={{
                        padding: "6px 8px", borderRadius: 6, border: "1px solid #e5e7eb",
                        marginBottom: 4, cursor: "pointer", background: "#f9fafb",
                      }}
                    >
                      <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
                        [{h.agent}] {h.time} · {h.prompt}
                      </div>
                      <div style={{ fontSize: 11, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.result.slice(0, 60)}…
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div style={{ flex: 1, overflow: "auto", padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                댓글 ({comments.length})
              </div>
              {comments.map(c => (
                <div key={c.id} style={{
                  padding: "8px 10px", background: "#f9fafb", borderRadius: 8,
                  border: "1px solid #e5e7eb", marginBottom: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: c.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {c.author.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: "#1b1b1f" }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{c.text}</div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div style={{ padding: "8px 12px 10px", borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
              <textarea
                rows={2}
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                }}
                placeholder="댓글 입력..."
                style={{
                  width: "100%", padding: "6px 8px", border: "1px solid #e5e7eb",
                  borderRadius: 7, fontSize: 12, resize: "none", outline: "none",
                  fontFamily: "inherit", color: "#1b1b1f", background: "#f9fafb",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                style={{
                  width: "100%", marginTop: 5, padding: "6px 0", borderRadius: 7, border: "none",
                  background: commentInput.trim() ? "#f97316" : "#e5e7eb",
                  color: commentInput.trim() ? "#fff" : "#9ca3af",
                  fontSize: 12, fontWeight: 700, cursor: commentInput.trim() ? "pointer" : "not-allowed",
                }}
              >
                댓글 추가
              </button>
            </div>

            {/* Recent activity */}
            <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                최근 활동
              </div>
              {[
                { user: "이서연", color: "#8b5cf6", action: "문서 편집", time: "방금" },
                { user: "김민준", color: "#3b82f6", action: "댓글 추가", time: "5분 전" },
                { user: "나", color: "#f97316", action: "AI 생성", time: "12분 전" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: a.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {a.user.charAt(0)}
                  </div>
                  <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>
                    <strong>{a.user}</strong> {a.action}
                  </span>
                  <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
