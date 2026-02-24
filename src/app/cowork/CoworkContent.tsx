"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";
import {
  joinChannel,
  sendContentUpdate,
  sendCursorUpdate,
  updatePresence,
  persistDoc,
  loadDoc,
  generateUserId,
  pickColor,
  type CollabUser,
  type ContentPayload,
  type CursorPayload,
} from "@/lib/collab";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Doc = { id: number | string; title: string; emoji: string; updatedAt: string; author: string; fromDb?: boolean };
type Comment = { id: number; author: string; color: string; text: string; time: string };
type OnlineUser = { id: string; name: string; color: string; initial: string; cursor: string };
type AiMode = "openai" | "anthropic" | "gemini";

// ─── AI Agent Definitions ─────────────────────────────────────────────────────

interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  description: string;
  defaultModel: AiMode;
  temperature: number;
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
  { id: 1, title: "Dalkak 제품 로드맵", emoji: "🗺️", updatedAt: "방금 전", author: "나" },
  { id: 2, title: "API 설계 문서", emoji: "📐", updatedAt: "1시간 전", author: "김민준" },
  { id: 3, title: "팀 규칙 & 문화", emoji: "🌱", updatedAt: "어제", author: "이서연" },
  { id: 4, title: "마케팅 전략 Q1", emoji: "📣", updatedAt: "2일 전", author: "박지호" },
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

const DEFAULT_CONTENT = `# Dalkak 제품 로드맵

## 2026년 1분기 목표

- [ ] AI 코드 생성 기능 출시
- [ ] 팀 협업 채팅 고도화
- [ ] 클라우드 스토리지 100GB 지원
- [ ] 모바일 반응형 완성

## 기술 스택

- **프론트엔드**: Next.js 16, React 18, Tailwind CSS, MUI v7
- **백엔드**: Next.js API Routes, Supabase
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini

## 일정

| 기능 | 담당자 | 마감 |
|------|--------|------|
| AI 채팅 | 김민준 | 2/28 |
| 파일 업로드 | 박지호 | 3/10 |
| 디자인 시스템 | 이서연 | 3/15 |`;

const STORAGE_KEY = "cowork_doc_content";
const COMMENT_STORAGE_PREFIX = "f9_cowork_comments_";
const MAX_STORED_COMMENTS = 100;

// ─── Comment localStorage helpers ─────────────────────────────────────────────

function loadStoredComments(docId: number | string): Comment[] {
  try {
    const raw = localStorage.getItem(`${COMMENT_STORAGE_PREFIX}${docId}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Comment =>
        typeof c === "object" && c !== null &&
        typeof (c as Comment).id === "number" &&
        typeof (c as Comment).text === "string",
    );
  } catch {
    return [];
  }
}

function saveStoredComments(docId: number | string, comments: Comment[]): void {
  try {
    const trimmed = comments.slice(-MAX_STORED_COMMENTS);
    localStorage.setItem(`${COMMENT_STORAGE_PREFIX}${docId}`, JSON.stringify(trimmed));
  } catch { /* quota exceeded — silently ignore */ }
}

// ─── Supabase 문서 API 헬퍼 ───────────────────────────────────────────────────

async function saveDocToDb(id: number | string, content: string, title: string, emoji: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/cowork/docs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, title, emoji }),
    });
    return r.ok;
  } catch { return false; }
}

async function createDocInDb(title: string, emoji: string): Promise<number | null> {
  try {
    const r = await fetch("/api/cowork/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, emoji, content: DEFAULT_CONTENT }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.doc?.id ?? null;
  } catch { return null; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoworkContent() {
  const [activeDocId, setActiveDocId]       = useState<number | string>(1);
  const [dbDocs, setDbDocs]                 = useState<Doc[]>([]);
  const [dbLoaded, setDbLoaded]             = useState(false);
  const [docContent, setDocContent]         = useState(DEFAULT_CONTENT);
  const [comments, setComments]             = useState<Comment[]>(INIT_COMMENTS);
  const [commentInput, setCommentInput]     = useState("");
  const [saved, setSaved]                   = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [onlineUsers, setOnlineUsers]       = useState<OnlineUser[]>([]);
  const [remoteCursors, setRemoteCursors]   = useState<Map<string, CursorPayload>>(new Map());
  const [shareToast, setShareToast]         = useState(false);
  const [docListOpen, setDocListOpen]       = useState(false);
  const { toasts, showToast } = useToast(4000);
  const isMobile = useMediaQuery("(max-width: 767px)");

  // AI agent state
  const [activeAgent, setActiveAgent]       = useState<AgentConfig>(AGENTS[0]);
  const [aiModel, setAiModel]              = useState<AiMode>(AGENTS[0].defaultModel);
  const [aiPrompt, setAiPrompt]            = useState("");
  const [aiLoading, setAiLoading]          = useState(false);
  const [aiResult, setAiResult]            = useState("");
  const [aiHistory, setAiHistory]          = useState<Array<{agent: string; prompt: string; result: string; time: string}>>([]);
  const [showHistory, setShowHistory]      = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);

  // Recent activity feed (real events)
  const [activityFeed, setActivityFeed]     = useState<Array<{ user: string; color: string; action: string; time: string }>>([
    { user: "시스템", color: "#9ca3af", action: "실시간 협업 준비됨", time: "방금" },
  ]);

  // Realtime refs
  const channelRef      = useRef<RealtimeChannel | null>(null);
  const broadcastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myId            = useRef(generateUserId());
  const myName          = useRef("나 (You)");
  const myColor         = useRef(pickColor(myId.current));
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const cursorPos       = useRef<number>(0);
  const isRemoteUpdate  = useRef(false);
  const saveTimer       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper: push to activity feed
  const pushActivity = useCallback((user: string, color: string, action: string) => {
    const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    setActivityFeed(prev => [{ user, color, action, time }, ...prev.slice(0, 9)]);
  }, []);

  // Load comments from localStorage when active doc changes
  useEffect(() => {
    const stored = loadStoredComments(activeDocId);
    if (stored.length > 0) {
      setComments(prev => {
        // Merge: keep all stored, then add any from prev that aren't in stored (by id)
        const ids = new Set(stored.map(c => c.id));
        const extra = prev.filter(c => !ids.has(c.id));
        return [...stored, ...extra].slice(-MAX_STORED_COMMENTS);
      });
    } else {
      // Reset to initial comments when switching to a doc with no stored comments
      setComments(INIT_COMMENTS);
    }
  }, [activeDocId]);

  // Persist comments to localStorage whenever they change
  useEffect(() => {
    saveStoredComments(activeDocId, comments);
  }, [comments, activeDocId]);

  // Load DB docs on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/cowork/docs");
        if (!r.ok) { showToast("문서 목록을 불러오지 못했습니다", "error"); setDbLoaded(true); return; }
        const d = await r.json();
        const docs: Doc[] = (d.docs ?? []).map((doc: { id: number; title: string; emoji: string; updated_at: string }) => ({
          id: doc.id, title: doc.title, emoji: doc.emoji,
          updatedAt: new Date(doc.updated_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
          author: "나", fromDb: true,
        }));
        setDbDocs(docs);
      } catch { showToast("문서 목록을 불러오지 못했습니다", "error"); }
      setDbLoaded(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Document switch: load content from DB or localStorage
  useEffect(() => {
    setAiResult("");
    setAiHistory([]);

    const activeDbDoc = dbDocs.find(d => d.id === activeDocId);
    if (activeDbDoc?.fromDb && typeof activeDocId === "number" && activeDocId > 4) {
      fetch(`/api/cowork/docs/${activeDocId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.doc?.content) setDocContent(d.doc.content); })
        .catch((err) => { console.error('[Dalkak]', err); });
    } else {
      // Try loading from collab persistence, fallback to localStorage
      const slug = `cowork_${activeDocId}`;
      loadDoc(slug).then(doc => {
        if (doc?.content) {
          setDocContent(doc.content);
        } else {
          const stored = localStorage.getItem(`${STORAGE_KEY}_${activeDocId}`);
          setDocContent(stored || DEFAULT_CONTENT);
        }
      });
    }
  }, [activeDocId, dbDocs]);

  // Agent switch resets model & prompt
  useEffect(() => {
    setAiModel(activeAgent.defaultModel);
    setAiPrompt("");
    setAiResult("");
  }, [activeAgent]);

  // ─── Supabase Realtime: join channel for active document ───────────────────
  useEffect(() => {
    // Clean up previous channel
    if (channelRef.current) {
      channelRef.current.untrack().catch((err) => { console.error('[Dalkak]', err); });
      // removeChannel handled by leave callback
    }

    const selfUser: OnlineUser = {
      id: myId.current,
      name: myName.current,
      color: myColor.current,
      initial: myName.current[0],
      cursor: "editing",
    };

    // Always show self
    setOnlineUsers([selfUser]);
    setRemoteCursors(new Map());

    const docSlug = `cowork_${activeDocId}`;

    const result = joinChannel(docSlug, myId.current, myName.current, {
      onContent: (payload: ContentPayload) => {
        // Received content update from another user
        isRemoteUpdate.current = true;
        setDocContent(payload.content);
        // Small delay to reset the flag after React state update
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      },
      onCursor: (payload: CursorPayload) => {
        setRemoteCursors(prev => {
          const next = new Map(prev);
          next.set(payload.userId, payload);
          return next;
        });
      },
      onPresence: (users: CollabUser[]) => {
        const mapped: OnlineUser[] = users.map(u => ({
          id: u.id,
          name: u.id === myId.current ? myName.current : u.name,
          color: u.color,
          initial: (u.id === myId.current ? myName.current : u.name)[0],
          cursor: u.cursor,
        }));
        // Ensure self is always first
        const selfIdx = mapped.findIndex(u => u.id === myId.current);
        if (selfIdx > 0) {
          const [me] = mapped.splice(selfIdx, 1);
          mapped.unshift(me);
        } else if (selfIdx < 0) {
          mapped.unshift(selfUser);
        }
        setOnlineUsers(mapped);
      },
    });

    if (result) {
      channelRef.current = result.channel;
    } else {
      channelRef.current = null;
    }

    return () => {
      if (result) result.leave();
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const pos = e.target.selectionStart;
    setDocContent(content);
    cursorPos.current = pos;

    // Don't re-broadcast content we just received from remote
    if (isRemoteUpdate.current) return;

    // Update presence to "editing"
    if (channelRef.current) {
      updatePresence(channelRef.current, {
        name: myName.current,
        color: myColor.current,
        cursor: "editing",
        joinedAt: new Date().toISOString(),
      }).catch((err) => { console.error('[Dalkak]', err); });
    }

    // Debounced content broadcast (300ms)
    if (broadcastTimer.current) clearTimeout(broadcastTimer.current);
    broadcastTimer.current = setTimeout(() => {
      if (channelRef.current) {
        sendContentUpdate(channelRef.current, content, myId.current, pos).catch((err) => { console.error('[Dalkak]', err); });
      }
    }, 300);

    // Debounced cursor broadcast (100ms)
    if (cursorTimer.current) clearTimeout(cursorTimer.current);
    cursorTimer.current = setTimeout(() => {
      if (channelRef.current) {
        sendCursorUpdate(channelRef.current, myId.current, myName.current, pos, myColor.current).catch((err) => { console.error('[Dalkak]', err); });
      }
    }, 100);

    // Auto-persist to collab_docs every 5 seconds of idle
    setAutoSaveStatus("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setAutoSaveStatus("saving");
      const slug = `cowork_${activeDocId}`;
      const activeDoc = [...dbDocs, ...DOCS].find(d => d.id === activeDocId);
      persistDoc(slug, activeDoc?.title ?? "Untitled", content)
        .then(() => {
          // Also save to localStorage as fallback
          localStorage.setItem(`${STORAGE_KEY}_${activeDocId}`, content);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 3000);
        })
        .catch(() => {
          setAutoSaveStatus("idle");
        });
    }, 5000);
  }, [activeDocId, dbDocs]);

  const handleTextareaClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const pos = (e.target as HTMLTextAreaElement).selectionStart;
    cursorPos.current = pos;

    // Broadcast cursor position
    if (channelRef.current) {
      sendCursorUpdate(channelRef.current, myId.current, myName.current, pos, myColor.current).catch((err) => { console.error('[Dalkak]', err); });
    }
  }, []);

  const handleSave = async () => {
    try {
      // DB save for authenticated docs
      const activeDbDoc = dbDocs.find(d => d.id === activeDocId);
      if (activeDbDoc?.fromDb) {
        const ok = await saveDocToDb(activeDocId, docContent, activeDbDoc.title, activeDbDoc.emoji);
        if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); pushActivity("나", myColor.current, "문서 저장"); return; }
        showToast("문서 저장에 실패했습니다", "error");
        return;
      }
      // Persist to collab_docs
      const slug = `cowork_${activeDocId}`;
      const activeDoc = [...dbDocs, ...DOCS].find(d => d.id === activeDocId);
      await persistDoc(slug, activeDoc?.title ?? "Untitled", docContent);
      // Fallback: localStorage
      localStorage.setItem(`${STORAGE_KEY}_${activeDocId}`, docContent);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      pushActivity("나", myColor.current, "문서 저장");
    } catch {
      showToast("문서 저장에 실패했습니다", "error");
    }
  };

  const handleNewDoc = async (label: string, emoji: string) => {
    const newId = await createDocInDb(label, emoji);
    if (newId) {
      const newDoc: Doc = { id: newId, title: label, emoji, updatedAt: "방금", author: "나", fromDb: true };
      setDbDocs(prev => [newDoc, ...prev]);
      setActiveDocId(newId);
      setDocContent(DEFAULT_CONTENT);
      pushActivity("나", myColor.current, `"${label}" 문서 생성`);
    }
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    const newComment: Comment = {
      id: Date.now(),
      author: myName.current,
      color: myColor.current,
      text: commentInput.trim(),
      time: now,
    };
    setComments(prev => [...prev, newComment]);
    setCommentInput("");
    pushActivity("나", myColor.current, "댓글 추가");

    // Broadcast comment to peers
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "doc_comment",
        payload: { comment: newComment, sender: myId.current },
      }).catch(() => { showToast("댓글 전송에 실패했습니다", "error"); });
    }
  };

  // Listen for remote comments
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;

    // We set up a comment listener on the channel after it's created.
    // Note: the joinChannel function only sets up content/cursor/presence listeners.
    // We add the comment listener here for this specific feature.
    channel.on(
      "broadcast",
      { event: "doc_comment" },
      (msg: { payload: { comment: Comment; sender: string } }) => {
        if (msg.payload.sender !== myId.current) {
          setComments(prev => {
            // Avoid duplicate by checking id
            if (prev.some(c => c.id === msg.payload.comment.id)) return prev;
            return [...prev, msg.payload.comment].slice(-MAX_STORED_COMMENTS);
          });
          pushActivity(msg.payload.comment.author, msg.payload.comment.color, "댓글 추가");
        }
      },
    );
    // Note: We do not return a cleanup for this specific on() binding because
    // the parent useEffect for the channel handles cleanup via leave().
  }, [activeDocId, pushActivity]); // Re-bind when channel changes

  const handleShareLink = () => {
    const url = `${window.location.origin}/cowork?doc=${activeDocId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }).catch(() => {
      // Fallback for clipboard failure
      window.prompt("공유 링크를 복사하세요:", url);
    });
  };

  // Read ?doc= query param on mount to join a shared doc
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get("doc");
    if (docParam) {
      const numId = Number(docParam);
      setActiveDocId(isNaN(numId) ? docParam : numId);
    }
  }, []);

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

      if (text) {
        const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        setAiHistory(prev => [{ agent: activeAgent.name, prompt: aiPrompt, result: text, time: now }, ...prev.slice(0, 9)]);
        pushActivity("나", myColor.current, `AI(${activeAgent.name}) 생성`);
      }
    } catch {
      setAiResult("AI 오류. /settings에서 API 키를 확인하세요.");
    }
    setAiLoading(false);
  }, [aiPrompt, aiLoading, docContent, activeAgent, aiModel, pushActivity]);

  const insertAIContent = () => {
    if (!aiResult) return;
    const pos = cursorPos.current || docContent.length;
    const before = docContent.slice(0, pos);
    const after  = docContent.slice(pos);
    const newContent = before + "\n\n" + aiResult + "\n\n" + after;
    setDocContent(newContent);
    setAiResult("");
    setAiPrompt("");

    // Broadcast the change
    if (channelRef.current) {
      sendContentUpdate(channelRef.current, newContent, myId.current, pos).catch((err) => { console.error('[Dalkak]', err); });
    }
  };

  const replaceWithAI = () => {
    if (!aiResult) return;
    setDocContent(aiResult);
    setAiResult("");
    setAiPrompt("");

    // Broadcast the change
    if (channelRef.current) {
      sendContentUpdate(channelRef.current, aiResult, myId.current, 0).catch((err) => { console.error('[Dalkak]', err); });
    }
  };

  const allDocs   = [...dbDocs, ...DOCS.filter(d => !dbDocs.some(db => db.id === d.id))];
  const activeDoc = allDocs.find(d => d.id === activeDocId) || DOCS[0];

  // Compute remote cursor indicators for the textarea
  const remoteCursorList = Array.from(remoteCursors.values());

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", background: "#fff", position: "relative" }}>

        {/* Mobile doc list backdrop */}
        {isMobile && docListOpen && (
          <div
            onClick={() => setDocListOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 20 }}
          />
        )}

        {/* --- Left: Doc List --- */}
        <div style={{
          width: 200, flexShrink: 0, background: "#f9fafb",
          borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
          ...(isMobile ? {
            position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 21,
            transform: docListOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease-in-out",
            boxShadow: docListOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
          } : {}),
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
                <button key={t.label} onClick={() => handleNewDoc(t.label, t.emoji)} style={{
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                문서 {dbLoaded && dbDocs.length > 0 ? `(${dbDocs.length})` : ""}
              </span>
              {dbLoaded && dbDocs.length === 0 && (
                <span style={{ fontSize: 9, color: "#d1d5db" }}>로그인 후 저장</span>
              )}
            </div>
            {allDocs.map(doc => (
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
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>{doc.updatedAt} · {doc.author}</span>
                  {doc.fromDb && <span style={{ fontSize: 8, color: "#22c55e", fontWeight: 700 }}>DB</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Center: Editor --- */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{
            padding: isMobile ? "8px 10px" : "8px 20px", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
            background: "#fff", flexShrink: 0, flexWrap: isMobile ? "nowrap" : "nowrap",
          }}>
            {isMobile && (
              <button onClick={() => setDocListOpen(v => !v)} aria-label="문서 목록 토글" style={{
                width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e7eb",
                background: "#f9fafb", fontSize: 14, cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                ☰
              </button>
            )}
            <span style={{ fontSize: 18, flexShrink: 0 }}>{activeDoc.emoji}</span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: "#1b1b1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeDoc.title}</span>
              {autoSaveStatus !== "idle" && (
                <span style={{
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                  color: autoSaveStatus === "saving" ? "#f59e0b" : "#22c55e",
                  transition: "opacity 0.3s",
                }}>
                  {autoSaveStatus === "saving" ? "저장 중..." : "저장됨 \u2713"}
                </span>
              )}
            </div>

            {/* Online users */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                {onlineUsers.map((u, i) => (
                  <div key={u.id} title={`${u.name} · ${u.cursor === "editing" ? "편집 중" : "보는 중"}`} style={{
                    width: 26, height: 26, borderRadius: "50%", background: u.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                    border: "2px solid #fff", marginLeft: i === 0 ? 0 : -5,
                    position: "relative",
                  }}>
                    {u.initial}
                    {u.cursor === "editing" && u.id !== myId.current && (
                      <div style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#22c55e", border: "1.5px solid #fff",
                      }} />
                    )}
                  </div>
                ))}
                <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>
                  {onlineUsers.length}명
                </span>
              </div>
            )}

            {/* Share button */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={handleShareLink}
                style={{
                  padding: isMobile ? "5px 8px" : "5px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                  background: "#f9fafb", color: "#6b7280",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                {isMobile ? "🔗" : "공유"}
              </button>
              {shareToast && (
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  marginTop: 6, padding: "4px 10px", borderRadius: 6,
                  background: "#1b1b1f", color: "#fff", fontSize: 11,
                  whiteSpace: "nowrap", zIndex: 10,
                }}>
                  링크 복사됨!
                </div>
              )}
            </div>

            <button
              onClick={() => setAgentPanelOpen(v => !v)}
              style={{
                padding: isMobile ? "5px 8px" : "5px 12px", borderRadius: 7, border: "1px solid #e5e7eb",
                background: agentPanelOpen ? "#fff7ed" : "#f9fafb",
                color: agentPanelOpen ? "#f97316" : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
              }}
            >
              {activeAgent.emoji}{isMobile ? "" : ` ${activeAgent.name}`}
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: isMobile ? "5px 10px" : "5px 14px", borderRadius: 7, border: "none",
                background: saved ? "#22c55e" : "#f97316",
                color: "#fff", fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s", flexShrink: 0,
              }}
            >
              {saved ? "저장됨" : "저장"}
            </button>
          </div>

          {/* Remote cursor indicators bar */}
          {remoteCursorList.length > 0 && (
            <div style={{
              padding: "4px 20px", borderBottom: "1px solid #f3f4f6",
              display: "flex", gap: 12, fontSize: 11, color: "#6b7280",
              background: "#fefce8", flexShrink: 0,
            }}>
              {remoteCursorList.map(c => (
                <span key={c.userId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: c.color, display: "inline-block",
                  }} />
                  <span style={{ fontWeight: 600, color: c.color }}>{c.userName}</span>
                  <span>pos {c.position}</span>
                </span>
              ))}
            </div>
          )}

          {/* Markdown editor */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <textarea
              ref={textareaRef}
              value={docContent}
              onChange={handleContentChange}
              onClick={handleTextareaClick}
              spellCheck={false}
              style={{
                width: "100%", height: "100%", padding: isMobile ? "12px 14px" : "24px 40px",
                border: "none", outline: "none", resize: "none",
                fontSize: isMobile ? 14 : 15, lineHeight: 1.85, color: "#1b1b1f",
                fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Mobile agent panel backdrop */}
        {isMobile && agentPanelOpen && (
          <div
            onClick={() => setAgentPanelOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 20 }}
          />
        )}

        {/* --- Right: Agent Panel + Comments --- */}
        {agentPanelOpen && (
          <div style={{
            width: isMobile ? "100%" : 300, flexShrink: 0, borderLeft: isMobile ? "none" : "1px solid #e5e7eb",
            display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff",
            ...(isMobile ? {
              position: "absolute", bottom: 0, left: 0, right: 0,
              zIndex: 21, maxHeight: "60vh",
              borderTop: "1px solid #e5e7eb",
              borderRadius: "16px 16px 0 0",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
            } : {}),
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
                  {showHistory ? "히스토리 닫기" : "생성 히스토리"}
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
                  {aiLoading ? "..." : "->"}
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
                      X
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
                        [{h.agent}] {h.time} - {h.prompt}
                      </div>
                      <div style={{ fontSize: 11, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {h.result.slice(0, 60)}...
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

            {/* Recent activity (real events) */}
            <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                최근 활동
              </div>
              {activityFeed.slice(0, 5).map((a, i) => (
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
      <ToastContainer toasts={toasts} />
    </AppShell>
  );
}
