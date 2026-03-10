"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  T, AI_HIST_KEY, calcCost, tokToUSD, KOREAN_BUSINESS_TEMPLATES,
} from "./workspace.constants";
import type { FilesMap } from "./workspace.constants";
import {
  useAiStore,
  useUiStore,
  useParameterStore,
  useLayoutStore,
  useAutonomousStore,
} from "./stores";
import { usePromptAutocomplete } from "./ai/usePromptAutocomplete";

const ParameterPanel = dynamic(
  () => import("./ParameterPanel").then(m => ({ default: m.ParameterPanel })),
  { ssr: false },
);
const AutonomousPanelLazy = dynamic(
  () => import("./AutonomousPanel").then(m => ({ default: m.AutonomousPanel })),
  { ssr: false },
);

// ─── Design tokens (ivory light) ──────────────────────────────────────────────
const D = {
  bg:          "#fafafa",
  bgPanel:     "#faf8f5",
  bgMsg:       "#fafafa",
  bgInput:     "#ffffff",
  bgHover:     "rgba(0,0,0,0.04)",
  bgCode:      "#1e1e2e",
  bgCodeHdr:   "#16161e",
  border:      "rgba(0,0,0,0.08)",
  borderFocus: "rgba(0,0,0,0.3)",
  textPrimary: "#0a0a0a",
  textSecond:  "rgba(0,0,0,0.55)",
  textMuted:   "rgba(0,0,0,0.4)",
  accent:      "#0a0a0a",
  accentB:     "#0a0a0a",
  accentGlow:  "rgba(0,0,0,0.08)",
  accentSoft:  "rgba(0,0,0,0.04)",
  green:       "#0a0a0a",
  red:         "#dc2626",
  blue:        "#0a0a0a",
  purple:      "#0a0a0a",
} as const;

// ─── Parse AI message into text/code segments ─────────────────────────────────
type MsgBlock =
  | { type: "text"; content: string }
  | { type: "code"; filename: string; content: string; lang: string };

function parseBlocks(text: string): MsgBlock[] {
  const blocks: MsgBlock[] = [];
  const pattern = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]|```(\w*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      const txt = text.slice(lastIdx, match.index).trim();
      if (txt) blocks.push({ type: "text", content: txt });
    }
    if (match[1] !== undefined) {
      blocks.push({ type: "code", filename: match[1].trim(), content: match[2].trim(), lang: match[1].split(".").pop() ?? "text" });
    } else {
      blocks.push({ type: "code", filename: "", content: match[4].trim(), lang: match[3] || "text" });
    }
    lastIdx = match.index + match[0].length;
  }
  const remaining = text.slice(lastIdx).trim();
  if (remaining) blocks.push({ type: "text", content: remaining });
  return blocks.length > 0 ? blocks : [{ type: "text", content: text }];
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────
function CodeBlock({ block, onApply }: { block: Extract<MsgBlock, { type: "code" }>; onApply: (code: string, filename: string) => void }) {
  const [copied, setCopied] = React.useState(false);
  const langColor: Record<string, string> = {
    html: "#e44d26", css: "#264de4", js: "#f0db4f", javascript: "#f0db4f",
    ts: "#3178c6", typescript: "#3178c6", py: "#3572a5", python: "#3572a5",
    json: "#adb5bd", bash: "#4eaa25", sh: "#4eaa25",
  };
  const ext = block.filename ? block.filename.split(".").pop() ?? block.lang : block.lang;
  const dotColor = langColor[ext] ?? D.textMuted;
  const handleCopy = () => {
    navigator.clipboard.writeText(block.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${D.border}`, background: D.bgCode, marginTop: 4 }}>
      {/* Code header — dark */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        background: D.bgCodeHdr,
        borderBottom: `1px solid ${D.border}`,
      }}>
        <span style={{ fontSize: 7, color: dotColor, fontWeight: 900 }}>{"\u2B24"}</span>
        <span style={{ flex: 1, fontSize: 10.5, color: D.textSecond, fontFamily: "inherit", letterSpacing: "0.01em" }}>
          {block.filename || block.lang}
        </span>
        <button onClick={handleCopy}
          style={{
            background: copied ? "rgba(63,185,80,0.15)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(63,185,80,0.35)" : D.border}`,
            color: copied ? D.green : D.textSecond, fontSize: 10, cursor: "pointer",
            fontFamily: "inherit", padding: "2px 8px", borderRadius: 5, transition: "all 0.15s",
          }}>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
        {block.filename && (
          <button onClick={() => onApply(block.content, block.filename)}
            style={{
              background: `linear-gradient(135deg,${D.accent},${D.accentB})`,
              border: "none", borderRadius: 5, color: "#fff", fontSize: 10,
              cursor: "pointer", fontFamily: "inherit", padding: "2px 10px", fontWeight: 700,
              boxShadow: "0 1px 6px rgba(249,115,22,0.25)",
            }}>
            Apply
          </button>
        )}
      </div>
      {/* Code content — dark */}
      <pre style={{
        margin: 0, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.65,
        color: "#e6edf3", fontFamily: '"JetBrains Mono","Fira Code",monospace',
        overflowX: "auto", maxHeight: 240, whiteSpace: "pre", background: D.bgCode,
      }}>
        {block.content}
      </pre>
    </div>
  );
}

// ─── Pulsing cursor for streaming ────────────────────────────────────────────
const StreamCursor = () => (
  <span style={{
    display: "inline-block", width: 2, height: "1em",
    background: D.accent, marginLeft: 2, verticalAlign: "text-bottom",
    borderRadius: 1,
    animation: "blink 1s step-end infinite",
  }} />
);

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AiChatPanelProps {
  handleAiSend: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleImageFile: (f: File) => void;
  toggleVoice: () => void;
  runAI: (prompt: string) => void;
  aiEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  abortRef: React.RefObject<AbortController | null>;
  filesRef: React.RefObject<FilesMap | null>;
  router: { push: (url: string) => void };
  onApplyCode?: (code: string, filename: string) => void;
  onShowTemplates?: () => void;
  onCompare?: (prompt: string) => void;
  onPublish?: () => void;
  onOpenGitHub?: () => void;
  onVercelDeploy?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
function AiChatPanelInner({
  handleAiSend, handleDrop, handlePaste,
  handleImageFile, toggleVoice, runAI, aiEndRef, fileInputRef, abortRef,
  filesRef, router, onApplyCode, onShowTemplates, onCompare,
  onPublish, onOpenGitHub, onVercelDeploy,
}: AiChatPanelProps) {
  // AI store
  const aiMsgs = useAiStore(s => s.aiMsgs);
  const aiLoading = useAiStore(s => s.aiLoading);
  const aiInput = useAiStore(s => s.aiInput);
  const setAiInput = useAiStore(s => s.setAiInput);
  const setAiMsgs = useAiStore(s => s.setAiMsgs);
  const imageAtt = useAiStore(s => s.imageAtt);
  const setImageAtt = useAiStore(s => s.setImageAtt);
  const streamingText = useAiStore(s => s.streamingText);
  const agentPhase = useAiStore(s => s.agentPhase);
  const isRecording = useAiStore(s => s.isRecording);
  const aiMode = useAiStore(s => s.aiMode);
  const selectedModelId = useAiStore(s => s.selectedModelId);

  // UI store
  const showToast = useUiStore(s => s.showToast);
  const showParams = useUiStore(s => s.showParams);
  const setShowParams = useUiStore(s => s.setShowParams);

  // Layout store
  const isMobile = useLayoutStore(s => s.isMobile);

  // Autonomous store
  const isAutonomousMode = useAutonomousStore(s => s.isAutonomousMode);
  const setIsAutonomousMode = useAutonomousStore(s => s.setIsAutonomousMode);

  const btnSize = isMobile ? 44 : 30;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  // Input focus glow state
  const [inputFocused, setInputFocused] = React.useState(false);

  // Slash commands
  const SLASH_COMMANDS = React.useMemo(() => [
    { cmd: "/review",   icon: "🔍", label: "코드 리뷰",     prompt: "현재 코드를 전문 개발자 관점에서 리뷰해줘. 버그, 성능 이슈, 보안 취약점, UX 개선점을 항목별로 한국어로 설명해줘." },
    { cmd: "/optimize", icon: "⚡", label: "성능 최적화",   prompt: "현재 코드의 성능을 최적화해줘. 불필요한 리렌더링, 메모리 누수, 느린 DOM 조작을 찾아서 개선해줘." },
    { cmd: "/explain",  icon: "📖", label: "코드 설명",     prompt: "현재 코드가 어떻게 동작하는지 한국어로 자세히 설명해줘." },
    { cmd: "/fix",      icon: "🔧", label: "버그 수정",     prompt: "현재 코드의 버그를 모두 찾아서 수정해줘." },
    { cmd: "/test",     icon: "🧪", label: "테스트 추가",   prompt: "현재 코드에 대한 단위 테스트를 추가해줘. 엣지 케이스와 에러 처리를 포함해줘." },
    { cmd: "/mobile",   icon: "📱", label: "모바일 최적화", prompt: "현재 앱을 모바일에 최적화해줘. 반응형 레이아웃, 터치 인터랙션, 적절한 폰트 크기를 적용해줘." },
    { cmd: "/dark",     icon: "🌙", label: "다크모드 추가", prompt: "현재 앱에 다크/라이트 모드 토글을 추가해줘. 시스템 설정에 따라 자동으로 적용되도록 해줘." },
    { cmd: "/i18n",     icon: "🌐", label: "다국어 지원",   prompt: "현재 앱에 한국어/영어 다국어 지원을 추가해줘. 언어 전환 버튼을 UI에 포함해줘." },
  ], []);
  const [slashQuery, setSlashQuery] = React.useState("");
  const [showSlash, setShowSlash] = React.useState(false);

  // Prompt history
  const [promptHistory, setPromptHistory] = React.useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("f9_prompt_history") ?? "[]") as string[]; } catch { return []; }
  });
  const [showHistory, setShowHistory] = React.useState(false);

  // AI diff tracking
  const prevFilesSnapshotRef = React.useRef<Set<string>>(new Set());
  const filteredCmds = React.useMemo(() =>
    slashQuery ? SLASH_COMMANDS.filter(c => c.cmd.includes(slashQuery) || c.label.includes(slashQuery)) : SLASH_COMMANDS,
  [slashQuery, SLASH_COMMANDS]);

  const handleSlashSelect = React.useCallback((prompt: string) => {
    setAiInput(prompt);
    setShowSlash(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [setAiInput]);

  const handleSendWithHistory = React.useCallback(() => {
    const trimmed = aiInput.trim();
    if (trimmed && trimmed.length > 3) {
      setPromptHistory(prev => {
        const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, 10);
        try { localStorage.setItem("f9_prompt_history", JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
    prevFilesSnapshotRef.current = new Set(Object.keys(filesRef.current ?? {}));
    setShowHistory(false);
    handleAiSend();
  }, [aiInput, handleAiSend, filesRef]);

  const enhancePrompt = React.useCallback(async () => {
    const current = aiInput.trim();
    if (!current || current.length < 5) { showToast?.("먼저 프롬프트를 입력하세요"); return; }

    const metaPrompt = `다음 짧은 앱 요청을 구체적이고 상세한 프롬프트로 개선해줘. 원래 의도를 유지하면서 기능, 디자인, UX를 구체화해. 개선된 프롬프트만 출력 (설명 없이):

"${current}"`;

    setAiInput("✨ 프롬프트 개선 중...");

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "당신은 AI 앱 빌더 전문가입니다. 사용자의 짧은 요청을 구체적인 앱 개발 프롬프트로 개선해주세요.",
          messages: [{ role: "user", content: metaPrompt }],
          mode: aiMode,
          model: selectedModelId,
          temperature: 0.7,
          maxTokens: 500,
        }),
      });

      let enhanced = "";
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try { const { text } = JSON.parse(line.slice(6)); if (text) enhanced += text; } catch {}
            }
          }
        }
      }
      setAiInput(enhanced.trim() || current);
    } catch {
      setAiInput(current);
    }
  }, [aiInput, aiMode, selectedModelId, setAiInput, showToast]);

  // Rotating placeholder
  const PLACEHOLDER_EXAMPLES = React.useMemo(() => [
    "카페 메뉴판 앱 만들어줘",
    "당근마켓 같은 중고거래 앱 만들어줘",
    "가계부 앱 만들어줘",
    "RPG 게임 만들어줘",
    "패션 쇼핑몰 만들어줘",
    "매출 대시보드 만들어줘",
    "스포티파이 같은 음악 플레이어 만들어줘",
    "영단어 암기 앱 만들어줘",
    "운동 기록 앱 만들어줘",
    "여행 플래너 만들어줘",
    "포트폴리오 사이트 만들어줘",
    "날씨 앱 만들어줘",
  ], []);
  const [placeholderIdx, setPlaceholderIdx] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_EXAMPLES.length), 3000);
    return () => clearInterval(id);
  }, [PLACEHOLDER_EXAMPLES.length]);
  const rotatingPlaceholder = isMobile ? "무엇을 만들까요?" : PLACEHOLDER_EXAMPLES[placeholderIdx];

  // Auto-expand textarea (max 5 lines)
  const autoResize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineH = isMobile ? 24 : 22;
    const maxH = lineH * 5 + (isMobile ? 28 : 24);
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [isMobile]);

  React.useEffect(() => { autoResize(); }, [aiInput, autoResize]);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setAiInput(val);
    autoResize();
    if (val.startsWith("/")) {
      setSlashQuery(val.slice(1).toLowerCase());
      setShowSlash(true);
    } else {
      setShowSlash(false);
    }
  }, [setAiInput, autoResize]);

  // Return focus after AI finishes
  const prevLoading = React.useRef(aiLoading);
  React.useEffect(() => {
    if (prevLoading.current && !aiLoading) {
      textareaRef.current?.focus();
    }
    prevLoading.current = aiLoading;
  }, [aiLoading]);

  // Ghost-text autocomplete
  const { suggestion: autoSuggestion, accept: acceptSuggestion, dismiss: dismissSuggestion } = usePromptAutocomplete(
    aiInput,
    (completed) => setAiInput(completed),
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: D.bg }}>

      {/* ── Header: "딸깍 AI" ── */}
      <div style={{
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", flexShrink: 0,
        background: "#faf8f5",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a" }}>딸깍 AI</span>
      </div>

      {/* ── Tab bar: Chat / Autonomous ── */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${D.border}`,
        flexShrink: 0, background: D.bgPanel,
      }}>
        <button
          onClick={() => setIsAutonomousMode(false)}
          style={{
            flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 600,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            background: "transparent",
            color: !isAutonomousMode ? D.textPrimary : D.textMuted,
            borderBottom: !isAutonomousMode ? `2px solid #0a0a0a` : "2px solid transparent",
            transition: "color 0.15s",
          }}
        >✦ 채팅</button>
        <button
          onClick={() => setIsAutonomousMode(true)}
          style={{
            flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 600,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            background: "transparent",
            color: isAutonomousMode ? D.textPrimary : D.textMuted,
            borderBottom: isAutonomousMode ? `2px solid #0a0a0a` : "2px solid transparent",
            transition: "color 0.15s",
          }}
        >⚡ 자율 에이전트</button>
      </div>

      {/* ── Autonomous panel ── */}
      {isAutonomousMode && (
        <AutonomousPanelLazy onSendAi={(prompt: string) => { setAiInput(prompt); handleAiSend(); }} />
      )}

      {/* ── Clear history bar ── */}
      {!isAutonomousMode && aiMsgs.length > 0 && (
        <div style={{
          display: "flex", justifyContent: "flex-end",
          padding: "5px 12px", borderBottom: `1px solid ${D.border}`, flexShrink: 0,
        }}>
          <button
            onClick={() => { setAiMsgs([]); try { localStorage.removeItem(AI_HIST_KEY); } catch {} }}
            style={{
              background: "none", border: "none", color: D.textMuted,
              fontSize: 10.5, cursor: "pointer", fontFamily: "inherit",
              padding: "2px 6px", borderRadius: 5, transition: "color 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = D.red)}
            onMouseLeave={e => (e.currentTarget.style.color = D.textMuted)}
            title="대화 기록 초기화">대화 초기화</button>
        </div>
      )}

      {/* ── Message list ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: isMobile ? "16px 14px 16px" : "20px 16px 12px",
        display: isAutonomousMode ? "none" : "flex",
        flexDirection: "column", gap: 16,
        background: D.bg,
        WebkitOverflowScrolling: "touch",
      }}>

        {/* ── Empty state ── */}
        {aiMsgs.length === 0 && !aiLoading && (
          <div style={{ textAlign: "center", padding: "48px 20px 32px", color: D.textMuted }}>
            {/* Logo / brand orb */}
            <div style={{
              width: 60, height: 60, borderRadius: 18, margin: "0 auto 20px",
              background: "#0a0a0a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, boxShadow: `0 8px 32px rgba(0,0,0,0.12)`,
              color: "#fff", fontWeight: 900,
            }}>D</div>
            <div style={{
              fontSize: 21, fontWeight: 700, color: D.textPrimary,
              marginBottom: 8, letterSpacing: "-0.02em",
            }}>무엇을 만들어 볼까요?</div>
            <div style={{ fontSize: 13, color: D.textSecond, lineHeight: 1.8, marginBottom: 28 }}>
              아이디어를 설명하면 AI가 즉시 코드를 생성합니다<br />
              <span style={{ fontSize: 11, color: D.textMuted }}>⌘ Enter 또는 Ctrl+Enter 로 전송</span>
            </div>
            {/* Suggestion chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 540, margin: "0 auto" }}>
              {KOREAN_BUSINESS_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => setAiInput(tpl.prompt)}
                  title={tpl.desc}
                  style={{
                    padding: "9px 15px", borderRadius: 10, fontSize: 12.5, fontWeight: 500,
                    border: `1px solid ${D.border}`, background: "rgba(255,255,255,0.03)",
                    color: D.textSecond, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.18s", display: "flex", alignItems: "center", gap: 6,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = D.accentGlow;
                    e.currentTarget.style.color = D.textPrimary;
                    e.currentTarget.style.background = D.accentSoft;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = D.border;
                    e.currentTarget.style.color = D.textSecond;
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.transform = "none";
                  }}
                ><span>{tpl.icon}</span>{tpl.name}</button>
              ))}
              {/* AI review chip */}
              <button
                onClick={() => {
                  const files = filesRef.current ?? {};
                  const hasCode = Object.values(files).some(f => f.content.length > 100 && !f.content.includes("Dalkak IDE"));
                  if (!hasCode) { showToast("\u26A0\uFE0F 리뷰할 코드가 없습니다"); return; }
                  const code = Object.entries(files).map(([n, f]) => `[${n}]\n${f.content}`).join("\n\n---\n\n");
                  runAI(`다음 코드를 전문 개발자 관점에서 리뷰해줘. 버그, 성능 이슈, 보안 취약점, UX 개선점을 항목별로 한국어로 설명해줘:\n${code}`);
                }}
                style={{
                  padding: "9px 15px", borderRadius: 10, fontSize: 12.5, fontWeight: 500,
                  border: `1px solid rgba(0,0,0,0.12)`,
                  background: "rgba(0,0,0,0.04)",
                  color: D.textPrimary, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)"; e.currentTarget.style.background = "rgba(0,0,0,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
              >🔍 현재 코드 AI 리뷰</button>
              {/* Template gallery chip */}
              {onShowTemplates && (
                <button onClick={onShowTemplates}
                  style={{
                    padding: "9px 15px", borderRadius: 10, fontSize: 12.5, fontWeight: 500,
                    border: `1px solid rgba(0,0,0,0.12)`,
                    background: D.accentSoft, color: D.textPrimary, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)"; e.currentTarget.style.background = "rgba(0,0,0,0.07)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.background = D.accentSoft; }}
                >📦 템플릿 갤러리</button>
              )}
            </div>
          </div>
        )}

        {/* ── Messages ── */}
        {aiMsgs.map((m, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            alignItems: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "100%",
          }}>
            {/* Image attachment */}
            {m.image && (
              <img src={m.image} alt="사용자가 첨부한 이미지" loading="lazy"
                style={{
                  maxWidth: "90%", maxHeight: 100, borderRadius: 8, marginBottom: 4,
                  objectFit: "cover", border: `1px solid ${D.border}`,
                }} />
            )}

            {m.role === "user" ? (
              /* ── User bubble — right-aligned, premium ── */
              <div style={{
                maxWidth: "82%", padding: "12px 16px",
                borderRadius: 12,
                background: "rgba(0,0,0,0.04)",
                border: `1px solid rgba(0,0,0,0.06)`,
                marginLeft: isMobile ? 0 : 40,
                color: D.textPrimary, fontSize: isMobile ? 14 : 13.5, lineHeight: 1.75,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.text}
              </div>
            ) : m.text.includes("[RETRY:") ? (
              /* ── Retry bubble ── */
              <div style={{
                maxWidth: "92%", padding: "10px 14px",
                paddingLeft: 16, borderLeft: "2px solid rgba(0,0,0,0.15)",
                background: "transparent",
                color: D.textPrimary, fontSize: 12, lineHeight: 1.65,
              }}>
                <span>{m.text.replace(/\[RETRY:[^\]]*\]/g, "").trim()}</span>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button onClick={() => {
                    const match = m.text.match(/\[RETRY:([^\]]*)\]/);
                    if (match) runAI(match[1]);
                  }} style={{
                    padding: "5px 12px", borderRadius: 7, border: "none",
                    background: D.accent, color: "#fff", fontSize: 11,
                    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    🔄 재시도
                  </button>
                  <button onClick={() => router.push("/settings")} style={{
                    padding: "5px 12px", borderRadius: 7,
                    border: `1px solid ${D.border}`, background: "transparent",
                    color: D.textSecond, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    ⚙️ API 설정
                  </button>
                </div>
              </div>
            ) : (
              /* ── Agent bubble — left-aligned, premium ── */
              <div style={{ maxWidth: "94%", display: "flex", flexDirection: "column", gap: 6 }}>
                {parseBlocks(m.text).map((block, bi) =>
                  block.type === "text" ? (
                    block.content ? (
                      <div key={bi} style={{
                        paddingLeft: 16,
                        borderLeft: "2px solid rgba(0,0,0,0.15)",
                        marginBottom: 0,
                        background: "transparent",
                        color: D.textPrimary, fontSize: isMobile ? 14 : 13.5, lineHeight: 1.78,
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                      }}>
                        {block.content}
                      </div>
                    ) : null
                  ) : (
                    <CodeBlock
                      key={bi}
                      block={block}
                      onApply={(code, filename) => {
                        onApplyCode?.(code, filename);
                        showToast(`✅ ${filename} 적용됨`);
                      }}
                    />
                  )
                )}
              </div>
            )}

            <span style={{ fontSize: 9.5, color: D.textMuted, marginTop: 4, paddingLeft: 2 }}>{m.ts}</span>
          </div>
        ))}

        {/* ── Post-generation CTA ── */}
        {!aiLoading && aiMsgs.length > 0 && (() => {
          const last = aiMsgs[aiMsgs.length - 1];
          if (last.role !== "agent") return null;
          const hasFiles = last.text.includes("[FILE:") || /```(html|css|javascript|js)\n/.test(last.text);
          if (!hasFiles) return null;
          const fileCount = Object.keys(filesRef.current ?? {}).length;
          const currentKeys = Object.keys(filesRef.current ?? {});
          const newFiles = currentKeys.filter(k => !prevFilesSnapshotRef.current.has(k));
          const modifiedFiles = currentKeys.filter(k => prevFilesSnapshotRef.current.has(k));
          const diffLabel = newFiles.length > 0
            ? `✨ ${newFiles.length}개 새 파일 + ${modifiedFiles.length}개 수정`
            : modifiedFiles.length > 0
            ? `✏️ ${modifiedFiles.length}개 파일 수정됨`
            : null;
          const downloadZip = async () => {
            const files = filesRef.current ?? {};
            if (!Object.keys(files).length) return;
            try {
              const { default: JSZip } = await import("jszip");
              const zip = new JSZip();
              for (const [k, v] of Object.entries(files)) zip.file(k, v.content);
              const blob = await zip.generateAsync({ type: "blob" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "project.zip"; a.click();
              showToast("📦 ZIP 다운로드 완료");
            } catch { showToast("⚠️ ZIP 생성 실패"); }
          };
          return (
            <div style={{
              margin: "6px 0 2px 0", padding: "12px 14px", borderRadius: 12,
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.08)",
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: D.textPrimary, marginBottom: diffLabel ? 4 : 10 }}>
                ✅ {fileCount}개 파일 생성 완료 — 다음 단계
              </div>
              {diffLabel && (
                <div style={{ fontSize: 10.5, color: D.green, marginBottom: 10, fontWeight: 600 }}>
                  {diffLabel}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {onPublish && (
                  <button onClick={onPublish} style={{
                    padding: "6px 12px", borderRadius: 7, border: "none",
                    background: "#0a0a0a",
                    color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}>🚀 공개 배포</button>
                )}
                {onOpenGitHub && (
                  <button onClick={onOpenGitHub} style={{
                    padding: "6px 12px", borderRadius: 7,
                    border: `1px solid ${D.border}`,
                    background: "rgba(0,0,0,0.04)", color: D.textPrimary,
                    fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 5, verticalAlign: "middle" }}>
                      <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    GitHub Push
                  </button>
                )}
                {onVercelDeploy && (
                  <button onClick={onVercelDeploy} style={{
                    padding: "6px 12px", borderRadius: 7, border: "none",
                    background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)",
                    color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}>▲ Vercel 배포</button>
                )}
                <button onClick={downloadZip} style={{
                  padding: "6px 12px", borderRadius: 7,
                  border: `1px solid ${D.border}`,
                  background: "rgba(0,0,0,0.04)", color: D.textSecond,
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>⬇️ ZIP 다운로드</button>
              </div>
            </div>
          );
        })()}

        {/* ── Loading / streaming ── */}
        {aiLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
            {/* Phase indicator */}
            {!streamingText && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 10,
                background: "rgba(249,115,22,0.05)",
                border: `1px solid rgba(249,115,22,0.12)`,
              }}>
                {(["planning", "coding", "reviewing"] as const).map((phase, i) => {
                  const labels = { planning: "🧠 계획", coding: "⚙️ 코딩", reviewing: "✅ 검토" };
                  const isActive = agentPhase === phase;
                  const isDone = (agentPhase === "coding" && i === 0) || (agentPhase === "reviewing" && i <= 1);
                  return (
                    <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                        color: isDone ? D.green : isActive ? D.accent : D.textMuted,
                        opacity: isActive ? 1 : isDone ? 0.9 : 0.45,
                      }}>{isDone ? "✓ " : ""}{labels[phase]}</span>
                      {i < 2 && <span style={{ color: D.border, fontSize: 9 }}>›</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Streaming bubble */}
            <div style={{
              maxWidth: "92%",
              paddingLeft: 16,
              borderLeft: "2px solid rgba(0,0,0,0.15)",
              background: "transparent",
              color: D.textPrimary, fontSize: isMobile ? 14 : 13.5, lineHeight: 1.78, whiteSpace: "pre-wrap",
            }}>
              {streamingText ? (
                <>
                  {streamingText}
                  <StreamCursor />
                </>
              ) : (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 10.5, color: D.textMuted }}>
                    {agentPhase === "planning" ? "계획 수립 중..." : agentPhase === "reviewing" ? "코드 검토 중..." : "생성 중"}
                  </span>
                  {[0, 1, 2].map(ii => (
                    <div key={ii} style={{
                      width: 4, height: 4, borderRadius: "50%", background: D.accent,
                      animation: `dotBounce 1.2s ${ii * 0.2}s ease-in-out infinite`,
                    }}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={aiEndRef as React.RefObject<HTMLDivElement>} />
      </div>

      {/* ── Image attachment preview ── */}
      {imageAtt && (
        <div style={{
          padding: "8px 12px", borderTop: `1px solid ${D.border}`,
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          background: D.bgPanel,
        }}>
          <img src={imageAtt.preview} alt="첨부된 이미지 미리보기" loading="lazy"
            style={{ height: 44, width: 44, objectFit: "cover", borderRadius: 7, border: `1px solid ${D.border}` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                background: "rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.12)",
                color: D.textPrimary, padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 800,
              }}>🎨 디자인 모드</span>
            </div>
            <div style={{ fontSize: 9.5, color: D.textMuted, marginTop: 3 }}>이미지를 분석하여 동일한 디자인으로 코드 생성</div>
          </div>
          <button onClick={() => setImageAtt(null)}
            style={{ background: "none", border: "none", color: D.textMuted, cursor: "pointer", fontSize: 18, padding: 4, lineHeight: 1 }}>
            ×
          </button>
        </div>
      )}

      {/* ── Parameter Panel ── */}
      {showParams && (
        <div style={{ padding: "8px 8px 0", flexShrink: 0 }}>
          <ParameterPanel />
        </div>
      )}

      {/* ── Input area ── */}
      <div style={{
        padding: isMobile ? "10px 12px 14px" : "10px 12px 12px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
        position: isMobile ? "sticky" : "relative",
        bottom: isMobile ? 0 : undefined,
        background: "#faf8f5",
        zIndex: isMobile ? 10 : undefined,
      }}>
        <div
          style={{
            display: "flex", flexDirection: "column",
            background: "#ffffff",
            borderRadius: 12,
            border: inputFocused ? "1px solid rgba(0,0,0,0.3)" : "1px solid rgba(0,0,0,0.1)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: inputFocused ? `0 0 0 3px rgba(0,0,0,0.05)` : "none",
          }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        >
          {/* ── Prompt history dropdown ── */}
          {showHistory && !showSlash && promptHistory.length > 0 && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              background: "#ffffff", border: `1px solid rgba(0,0,0,0.1)`,
              borderRadius: 10, overflow: "hidden", zIndex: 50,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
              marginBottom: 5,
            }}>
              <div style={{
                padding: "7px 12px", fontSize: 9.5,
                color: "rgba(0,0,0,0.4)", fontWeight: 700,
                borderBottom: `1px solid ${D.border}`, letterSpacing: "0.05em",
              }}>
                최근 프롬프트 — 클릭으로 재사용
              </div>
              {promptHistory.map((h, idx) => (
                <button key={idx}
                  onMouseDown={e => { e.preventDefault(); setAiInput(h); setShowHistory(false); setTimeout(() => textareaRef.current?.focus(), 0); }}
                  style={{
                    display: "block", width: "100%", padding: "8px 12px",
                    border: "none", background: "transparent", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit", fontSize: 12,
                    color: D.textSecond, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "rgba(0,0,0,0.3)", marginRight: 7 }}>↺</span>{h}
                </button>
              ))}
            </div>
          )}

          {/* ── Slash command palette ── */}
          {showSlash && filteredCmds.length > 0 && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              background: "#ffffff", border: `1px solid rgba(0,0,0,0.12)`,
              borderRadius: 10, overflow: "hidden", zIndex: 50,
              boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
              marginBottom: 5,
            }}>
              <div style={{
                padding: "7px 12px", fontSize: 9.5,
                color: "rgba(0,0,0,0.45)", fontWeight: 700,
                borderBottom: `1px solid ${D.border}`, letterSpacing: "0.05em",
              }}>
                슬래시 커맨드 — Tab 또는 클릭으로 선택
              </div>
              {filteredCmds.map(c => (
                <button key={c.cmd}
                  onMouseDown={e => { e.preventDefault(); handleSlashSelect(c.prompt); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "8px 12px", border: "none",
                    background: "transparent", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ fontSize: 14 }}>{c.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: D.accent, minWidth: 80 }}>{c.cmd}</span>
                  <span style={{ fontSize: 11, color: D.textSecond }}>{c.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── Textarea ── */}
          <textarea
            ref={textareaRef}
            value={aiInput}
            onChange={handleInputChange}
            onFocus={() => {
              setInputFocused(true);
              if (!aiInput.trim() && promptHistory.length > 0) setShowHistory(true);
            }}
            onBlur={() => {
              setInputFocused(false);
              setTimeout(() => setShowHistory(false), 150);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendWithHistory(); }
              if (e.key === "ArrowUp" && !aiInput.trim() && promptHistory.length > 0) {
                e.preventDefault();
                setShowHistory(true);
              }
              if (e.key === "Tab" && showSlash && filteredCmds.length > 0) {
                e.preventDefault();
                handleSlashSelect(filteredCmds[0].prompt);
              } else if (e.key === "Tab" && autoSuggestion && !showSlash) {
                e.preventDefault();
                acceptSuggestion();
              }
              if (e.key === "Escape") { setShowSlash(false); setShowHistory(false); dismissSuggestion(); }
            }}
            onPaste={handlePaste}
            placeholder={rotatingPlaceholder}
            disabled={aiLoading}
            aria-label="AI에게 보낼 메시지 입력"
            rows={1}
            style={{
              width: "100%", background: "transparent",
              border: "none", color: D.textPrimary,
              padding: `${isMobile ? 14 : 12}px ${isMobile ? 18 : 14}px 4px`,
              fontSize: isMobile ? 16 : 14, fontFamily: "inherit",
              resize: "none", outline: "none", lineHeight: 1.65,
              minHeight: isMobile ? 48 : 40,
              caretColor: "#0a0a0a",
            }}
          />

          {/* ── Ghost-text autocomplete ── */}
          {autoSuggestion && !aiLoading && (
            <div style={{
              padding: `0 ${isMobile ? 18 : 14}px 6px`,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                fontSize: isMobile ? 15 : 13, color: "rgba(139,148,158,0.45)",
                fontFamily: "inherit", lineHeight: 1.65, flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{autoSuggestion}</span>
              <span
                onClick={acceptSuggestion}
                style={{
                  fontSize: 10, color: D.textMuted, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", padding: "1px 6px",
                  borderRadius: 4, flexShrink: 0, userSelect: "none",
                  border: `1px solid ${D.border}`,
                }}
                title="클릭하거나 Tab을 눌러 자동완성 적용"
              >Tab</span>
            </div>
          )}

          {/* ── Button row ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: isMobile ? 6 : 4,
            padding: `4px ${isMobile ? 10 : 8}px ${isMobile ? 10 : 7}px`,
          }}>
            {/* Prompt enhance (✨) */}
            <button
              onClick={enhancePrompt}
              title="AI로 프롬프트 개선"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "5px 6px", borderRadius: 7, color: D.textMuted,
                fontSize: 15, transition: "all 0.15s", lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = D.accent; e.currentTarget.style.background = "rgba(249,115,22,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = D.textMuted; e.currentTarget.style.background = "none"; }}
            >✨</button>

            {/* Image attach */}
            <input ref={fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
            <button
              onClick={() => (fileInputRef as React.RefObject<HTMLInputElement>).current?.click()}
              title="이미지 첨부" aria-label="이미지 첨부"
              style={{
                width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7, flexShrink: 0,
                border: `1px solid ${imageAtt ? "#0a0a0a" : D.border}`,
                background: imageAtt ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.03)",
                color: imageAtt ? "#0a0a0a" : D.textMuted, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!imageAtt) { e.currentTarget.style.background = D.bgHover; e.currentTarget.style.color = D.textPrimary; } }}
              onMouseLeave={e => { if (!imageAtt) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = D.textMuted; } }}
            >
              <svg width={isMobile ? 18 : 13} height={isMobile ? 18 : 13} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2" width="10" height="8" rx="1.5"/><circle cx="4" cy="5" r="1"/><path d="M1 9l3-3 2 2 2-3 3 4"/>
              </svg>
            </button>

            {/* Voice */}
            <button
              onClick={toggleVoice}
              title={isRecording ? "음성 입력 중지" : "음성으로 입력"}
              aria-label={isRecording ? "음성 입력 중지" : "음성으로 입력"}
              style={{
                width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7, flexShrink: 0,
                border: `1px solid ${isRecording ? D.red : D.border}`,
                background: isRecording ? "rgba(220,38,38,0.08)" : "rgba(0,0,0,0.03)",
                color: isRecording ? D.red : D.textMuted, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: isRecording ? "pulse 1s ease-in-out infinite" : "none",
                transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!isRecording) { e.currentTarget.style.background = D.bgHover; e.currentTarget.style.color = D.textPrimary; } }}
              onMouseLeave={e => { if (!isRecording) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = D.textMuted; } }}
            >
              <svg width={isMobile ? 18 : 13} height={isMobile ? 18 : 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="9" y1="22" x2="15" y2="22"/>
              </svg>
            </button>

            {/* Gear (params) */}
            <button
              onClick={() => setShowParams(!showParams)}
              title="AI 설정" aria-label="AI 파라미터 설정"
              style={{
                width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7, flexShrink: 0,
                border: `1px solid ${showParams ? "#0a0a0a" : D.border}`,
                background: showParams ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.03)",
                color: showParams ? "#0a0a0a" : D.textMuted, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: isMobile ? 18 : 13, transition: "all 0.12s",
              }}
              onMouseEnter={e => { if (!showParams) { e.currentTarget.style.background = D.bgHover; e.currentTarget.style.color = D.textPrimary; } }}
              onMouseLeave={e => { if (!showParams) { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = D.textMuted; } }}
            >⚙️</button>

            {/* Compare */}
            {onCompare && (
              <button
                onClick={() => { if (aiInput.trim()) onCompare(aiInput.trim()); }}
                title="모델 비교"
                disabled={!aiInput.trim() || aiLoading}
                style={{
                  width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7, flexShrink: 0,
                  border: `1px solid ${D.border}`,
                  background: "rgba(0,0,0,0.03)",
                  color: aiInput.trim() && !aiLoading ? "#0a0a0a" : D.textMuted,
                  cursor: aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isMobile ? 16 : 12, fontFamily: "inherit", fontWeight: 700,
                  transition: "all 0.12s",
                }}
              >📊</button>
            )}

            <div style={{ flex: 1 }} />

            {/* Cost estimate */}
            {aiInput.trim() && !aiLoading && (
              <span style={{ fontSize: 10, color: "rgba(0,0,0,0.5)", fontWeight: 600, flexShrink: 0, opacity: 0.8 }}>
                ⚡ {tokToUSD(calcCost(aiInput))}
              </span>
            )}

            {/* Stop */}
            {aiLoading && (
              <button
                onClick={() => abortRef.current?.abort()}
                style={{
                  background: "rgba(248,81,73,0.1)", border: `1px solid rgba(248,81,73,0.2)`,
                  color: D.red, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit",
                  flexShrink: 0, padding: "3px 9px", borderRadius: 6, fontWeight: 600,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,81,73,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,81,73,0.1)"; }}
              >✕ 중단</button>
            )}

            {/* Send */}
            <button
              onClick={handleSendWithHistory}
              disabled={!aiInput.trim() || aiLoading}
              aria-label="메시지 전송"
              style={{
                width: isMobile ? 44 : 34, height: isMobile ? 44 : 34,
                borderRadius: isMobile ? 12 : 9, border: "none", flexShrink: 0,
                background: aiInput.trim() && !aiLoading
                  ? "#0a0a0a"
                  : "rgba(0,0,0,0.07)",
                color: aiInput.trim() && !aiLoading ? "#fff" : D.textMuted,
                cursor: aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s",
                boxShadow: aiInput.trim() && !aiLoading ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
              }}
              onMouseEnter={e => {
                if (aiInput.trim() && !aiLoading) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = aiInput.trim() && !aiLoading ? "0 2px 8px rgba(0,0,0,0.2)" : "none";
              }}
            >
              {aiLoading
                ? <div style={{ width: isMobile ? 14 : 12, height: isMobile ? 14 : 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
                : <svg width={isMobile ? 16 : 12} height={isMobile ? 16 : 12} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9V1M1 5l4-4 4 4"/></svg>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export const AiChatPanel = React.memo(AiChatPanelInner);
