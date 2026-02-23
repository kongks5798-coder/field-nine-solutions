"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { T as _T } from "@/lib/theme";

const T = { ..._T, purple: "#a855f7" };

type Provider = "ollama" | "openai" | "anthropic" | "gemini" | "grok";

interface LMModel {
  id:         string;
  name:       string;
  provider:   string;
  available:  boolean;
  contextLen: number;
  speed:      string;
  cost:       string;
  size?:      string;
}

interface Message { role: "user" | "assistant"; content: string; ts: number; }

const PROVIDER_COLORS: Record<string, string> = {
  ollama:    T.green,
  openai:    T.blue,
  anthropic: T.purple,
  gemini:    T.accent,
  grok:      "#fff",
};

const SPEED_COLORS: Record<string, string> = {
  fast: T.green, medium: T.accent, slow: T.muted, local: T.blue,
};

function ModelCard({ model, selected, onClick, compareSelected }: { model: LMModel; selected: boolean; onClick: () => void; compareSelected?: boolean }) {
  const pc = PROVIDER_COLORS[model.provider] ?? T.muted;
  const isCompare = compareSelected !== undefined;
  const highlighted = isCompare ? !!compareSelected : selected;
  const borderColor = highlighted
    ? (isCompare ? T.purple : T.accent)
    : T.border;
  const bgColor = highlighted
    ? (isCompare ? "rgba(168,85,247,0.08)" : "rgba(249,115,22,0.08)")
    : "rgba(255,255,255,0.02)";

  return (
    <div onClick={model.available ? onClick : undefined} style={{
      padding: "12px 14px", borderRadius: 12, cursor: model.available ? "pointer" : "default",
      border: `1px solid ${borderColor}`,
      background: bgColor,
      opacity: model.available ? 1 : 0.4,
      transition: "border-color 0.15s, background 0.15s",
      position: "relative",
    }}>
      {isCompare && compareSelected && (
        <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: T.purple, fontWeight: 800 }}>
          비교
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{model.name}</span>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${pc}20`, color: pc, fontWeight: 700, textTransform: "uppercase" }}>
          {model.provider}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: T.muted }}>ctx: {(model.contextLen / 1000).toFixed(0)}k</span>
        <span style={{ fontSize: 10, color: SPEED_COLORS[model.speed] ?? T.muted }}>{model.speed}</span>
        <span style={{ fontSize: 10, color: T.muted }}>{model.cost}</span>
        {model.size && <span style={{ fontSize: 10, color: T.green }}>{model.size}</span>}
        {!model.available && <span style={{ fontSize: 10, color: T.red }}>키 미설정</span>}
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser ? T.accent : "linear-gradient(135deg, #a855f7, #60a5fa)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff",
      }}>
        {isUser ? "나" : "AI"}
      </div>
      <div style={{
        maxWidth: "75%", padding: "10px 14px", borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "rgba(249,115,22,0.15)" : T.card,
        border: `1px solid ${isUser ? "rgba(249,115,22,0.3)" : T.border}`,
        fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>
        {msg.content || <span style={{ color: T.muted, fontStyle: "italic" }}>생성 중...</span>}
      </div>
    </div>
  );
}

export default function DalkkakLMPage() {
  const [models,    setModels]    = useState<LMModel[]>([]);
  const [selected,  setSelected]  = useState<LMModel | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [system,    setSystem]    = useState("당신은 Dalkak AI입니다. 전문적이고 친절하게 답변해주세요.");
  const [streaming, setStreaming] = useState(false);
  const [ollamaOn,  setOllamaOn] = useState(false);
  const [error,     setError]    = useState("");
  const [toast, setToast] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [compareMode, setCompareMode] = useState(false);
  const [compareModels, setCompareModels] = useState<LMModel[]>([]);
  const [compareResults, setCompareResults] = useState<Array<{ model: string; provider: string; text: string; latencyMs: number; tokenEstimate: number; error?: string }>>([]);
  const [comparing, setComparing] = useState(false);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };
  const bottomRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/lm/models")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        setModels(d.models ?? []);
        setOllamaOn(!!d.ollamaOnline);
        if (!d.ollamaOnline) {
          showToast("Ollama 연결 실패 — localhost:11434가 실행 중인지 확인하세요");
        }
        const first = (d.models ?? []).find((m: LMModel) => m.available);
        if (first) setSelected(first);
      })
      .catch(() => {
        setError("모델 목록 로드 실패");
        showToast("모델 목록을 불러오지 못했습니다");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Token estimation helper ── */
  const estimateTokens = useCallback((text: string): number => {
    if (!text) return 0;
    let tokens = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      // Korean characters (Hangul syllables + Jamo)
      if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) {
        tokens += 0.5; // ~2 chars per token for Korean
      } else {
        tokens += 0.25; // ~4 chars per token for English/others
      }
    }
    return Math.max(1, Math.ceil(tokens));
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() || streaming || comparing) return;

    /* ── Compare mode ── */
    if (compareMode) {
      if (compareModels.length < 2) {
        showToast("비교 모드에서는 2개 이상의 모델을 선택해주세요");
        return;
      }
      setError("");
      setComparing(true);
      setCompareResults([]);

      try {
        const r = await fetch("/api/lm/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            models: compareModels.map(m => ({ id: m.id, provider: m.provider })),
            system,
            messages: [{ role: "user", content: input.trim() }],
            temperature,
            maxTokens,
          }),
        });

        if (!r.ok) {
          const statusMsg = r.status === 429 ? "API 호출 한도 초과" : r.status === 401 ? "API 키를 확인해주세요" : `비교 실패 (${r.status})`;
          setError(statusMsg);
          showToast(statusMsg);
          setComparing(false);
          return;
        }

        const data = await r.json();
        setCompareResults(data.results ?? []);
      } catch (e) {
        const msg = (e as Error).message;
        setError(msg);
        showToast(`비교 오류: ${msg}`);
      } finally {
        setComparing(false);
      }
      return;
    }

    /* ── Normal (single model) mode ── */
    if (!selected) return;
    setError("");
    const userMsg: Message = { role: "user", content: input.trim(), ts: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages([...newHistory, { role: "assistant", content: "", ts: Date.now() }]);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const r = await fetch("/api/lm/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          model:    selected.id,
          provider: selected.provider,
          system,
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          temperature,
          maxTokens,
        }),
      });

      if (!r.ok) {
        const statusMsg = r.status === 429 ? "API 호출 한도 초과" : r.status === 401 ? "API 키를 확인해주세요" : `생성 실패 (${r.status})`;
        setError(statusMsg);
        showToast(statusMsg);
        setStreaming(false);
        return;
      }

      const reader = r.body?.getReader();
      const dec = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const t = JSON.parse(line.slice(6)).text;
              if (t) setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + t };
                return next;
              });
            } catch { /* skip malformed SSE lines */ }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const msg = (e as Error).message;
        setError(msg);
        showToast(`생성 오류: ${msg}`);
      }
    } finally {
      setStreaming(false);
    }
  }, [input, selected, streaming, messages, system, temperature, maxTokens, compareMode, compareModels, comparing]);

  const stop = () => { abortRef.current?.abort(); setStreaming(false); };
  const clear = () => { setMessages([]); setCompareResults([]); };

  /* ── Export conversation as markdown ── */
  const exportMarkdown = useCallback(() => {
    if (messages.length === 0) {
      showToast("내보낼 대화가 없습니다");
      return;
    }
    const lines: string[] = [
      `# Dalkak LM 대화 기록`,
      `> 모델: ${selected?.name ?? "미선택"} (${selected?.provider ?? "-"})`,
      `> 내보내기: ${new Date().toLocaleString("ko-KR")}`,
      "",
    ];
    for (const msg of messages) {
      if (msg.role === "user") {
        lines.push(`## 사용자`, "", msg.content, "");
      } else {
        lines.push(`## AI (${selected?.name ?? "모델"})`, "", msg.content, "");
      }
    }
    const md = lines.join("\n");
    navigator.clipboard.writeText(md).then(() => {
      showToast("대화가 마크다운으로 복사되었습니다");
    }).catch(() => {
      showToast("복사에 실패했습니다");
    });
  }, [messages, selected]);

  /* ── Compare model toggle handler ── */
  const toggleCompareModel = useCallback((model: LMModel) => {
    setCompareModels(prev => {
      const exists = prev.find(m => m.id === model.id);
      if (exists) return prev.filter(m => m.id !== model.id);
      if (prev.length >= 4) {
        showToast("최대 4개 모델까지 비교 가능합니다");
        return prev;
      }
      return [...prev, model];
    });
  }, []);

  const ollamaModels = models.filter(m => m.provider === "ollama");
  const cloudModels  = models.filter(m => m.provider !== "ollama");

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', overflow: "hidden" }}>

        {/* ── Left: Model List ── */}
        <div style={{ width: 280, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>Dalkak LM</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>자체 언어모델 허브</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: ollamaOn ? T.green : T.muted, boxShadow: ollamaOn ? `0 0 6px ${T.green}` : "none" }} />
              <span style={{ color: ollamaOn ? T.green : T.muted }}>{ollamaOn ? "Ollama 온라인" : "Ollama 오프라인"}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {compareMode && (
              <div style={{ fontSize: 10, color: T.purple, padding: "4px 6px 10px", fontWeight: 600, lineHeight: 1.5 }}>
                비교할 모델을 2~4개 선택하세요 ({compareModels.length}/4)
              </div>
            )}
            {/* Ollama local models */}
            {ollamaModels.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 2px 8px" }}>
                  로컬 모델 (Ollama)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {ollamaModels.map(m => (
                    <ModelCard
                      key={m.id}
                      model={m}
                      selected={selected?.id === m.id}
                      onClick={() => compareMode ? toggleCompareModel(m) : setSelected(m)}
                      compareSelected={compareMode ? compareModels.some(cm => cm.id === m.id) : undefined}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Cloud models */}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 2px 8px" }}>
              클라우드 모델
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cloudModels.map(m => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={selected?.id === m.id}
                  onClick={() => compareMode ? toggleCompareModel(m) : setSelected(m)}
                  compareSelected={compareMode ? compareModels.some(cm => cm.id === m.id) : undefined}
                />
              ))}
            </div>
          </div>

          {/* Ollama install hint */}
          {!ollamaOn && (
            <div style={{ padding: 14, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.muted }}>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>로컬 LM 실행하기</div>
              <div style={{ marginBottom: 6 }}>ollama.ai에서 Ollama를 설치한 후:</div>
              <code style={{ display: "block", background: T.card, padding: "6px 10px", borderRadius: 6, fontSize: 10, color: T.green, wordBreak: "break-all" }}>
                ollama run llama3.2
              </code>
            </div>
          )}
        </div>

        {/* ── Center: Chat ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              {compareMode ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: T.purple }}>
                  비교 모드 — {compareModels.length > 0 ? compareModels.map(m => m.name).join(" vs ") : "모델을 선택하세요"}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selected ? selected.name : "모델을 선택하세요"}</span>
                  {selected && <span style={{ fontSize: 11, color: PROVIDER_COLORS[selected.provider] ?? T.muted, marginLeft: 8 }}>{selected.provider}</span>}
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setCompareMode(prev => !prev);
                  setCompareModels([]);
                  setCompareResults([]);
                }}
                style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 7,
                  border: `1px solid ${compareMode ? T.purple : T.border}`,
                  background: compareMode ? "rgba(168,85,247,0.15)" : "transparent",
                  color: compareMode ? T.purple : T.muted,
                  cursor: "pointer", fontWeight: compareMode ? 700 : 400,
                }}
              >
                비교 모드
              </button>
              <button onClick={exportMarkdown} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
                내보내기
              </button>
              <button onClick={clear} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
                대화 초기화
              </button>
            </div>
          </div>

          {/* Messages / Compare Results */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {compareMode && compareResults.length > 0 ? (
              /* ── Compare results grid ── */
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.purple, marginBottom: 16 }}>비교 결과</div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(compareResults.length, 4)}, 1fr)`,
                  gap: 12,
                }}>
                  {compareResults.map((r, i) => {
                    const pc = PROVIDER_COLORS[r.provider] ?? T.muted;
                    return (
                      <div key={i} style={{
                        background: T.card, border: `1px solid ${r.error ? T.red : T.border}`,
                        borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
                      }}>
                        {/* Model name header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.model}</span>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 20, background: `${pc}20`, color: pc, fontWeight: 700, textTransform: "uppercase" }}>
                            {r.provider}
                          </span>
                        </div>
                        {/* Stats */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>
                            {r.latencyMs >= 1000 ? `${(r.latencyMs / 1000).toFixed(1)}s` : `${r.latencyMs}ms`}
                          </span>
                          <span style={{ fontSize: 10, color: T.muted }}>
                            ~{r.tokenEstimate} 토큰
                          </span>
                        </div>
                        {/* Response text */}
                        {r.error ? (
                          <div style={{ fontSize: 12, color: T.red, lineHeight: 1.5 }}>{r.error}</div>
                        ) : (
                          <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400, overflowY: "auto" }}>
                            {r.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : compareMode && comparing ? (
              <div style={{ textAlign: "center", color: T.muted, marginTop: 60 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.purple, marginBottom: 6 }}>모델 비교 중...</div>
                <div style={{ fontSize: 13 }}>{compareModels.map(m => m.name).join(", ")} 응답 대기 중</div>
              </div>
            ) : messages.length === 0 && !compareMode ? (
              <div style={{ textAlign: "center", color: T.muted, marginTop: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🤖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>Dalkak LM</div>
                <div style={{ fontSize: 13 }}>왼쪽에서 모델을 선택하고 대화를 시작하세요</div>
                {!selected && <div style={{ fontSize: 12, marginTop: 4, color: T.red }}>사용 가능한 모델이 없습니다 — API 키를 확인하세요</div>}
              </div>
            ) : compareMode && messages.length === 0 ? (
              <div style={{ textAlign: "center", color: T.muted, marginTop: 60 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.purple, marginBottom: 6 }}>비교 모드</div>
                <div style={{ fontSize: 13 }}>왼쪽에서 2~4개 모델을 선택하고 메시지를 입력하세요</div>
              </div>
            ) : messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 8, marginBottom: 12 }}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "12px 20px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={compareMode ? "비교할 메시지 입력... (Enter 전송)" : "메시지 입력... (Shift+Enter 줄바꿈, Enter 전송)"}
                rows={2}
                disabled={compareMode ? (compareModels.length < 2 || comparing) : (!selected || streaming)}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
                  background: T.card, color: T.text, fontSize: 13, resize: "none", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.5,
                }}
              />
              {streaming ? (
                <button onClick={stop} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  중지
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={compareMode ? (compareModels.length < 2 || !input.trim() || comparing) : (!selected || !input.trim())}
                  style={{
                    padding: "10px 20px", borderRadius: 10, border: "none",
                    background: (() => {
                      if (compareMode) return compareModels.length >= 2 && input.trim() ? `linear-gradient(135deg, ${T.purple}, #60a5fa)` : "rgba(255,255,255,0.1)";
                      return selected && input.trim() ? "linear-gradient(135deg, #f97316, #f43f5e)" : "rgba(255,255,255,0.1)";
                    })(),
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: (() => {
                      if (compareMode) return compareModels.length >= 2 && input.trim() ? "pointer" : "default";
                      return selected && input.trim() ? "pointer" : "default";
                    })(),
                    flexShrink: 0,
                  }}
                >
                  {compareMode ? "비교 전송" : "전송"}
                </button>
              )}
            </div>
            {/* Token estimation */}
            {input.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: T.muted, paddingLeft: 2 }}>
                예상 토큰 수: ~{estimateTokens(input)} 토큰 ({input.length}자)
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Settings ── */}
        <div style={{ width: 260, background: T.surface, borderLeft: `1px solid ${T.border}`, overflowY: "auto", padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 14 }}>설정</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>시스템 프롬프트</label>
            <textarea
              value={system}
              onChange={e => setSystem(e.target.value)}
              rows={4}
              style={{ display: "block", width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>

          {/* Temperature */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Temperature
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: T.accent }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text, minWidth: 28, textAlign: "right" }}>
                {temperature.toFixed(1)}
              </span>
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              낮을수록 일관된 응답, 높을수록 창의적 응답
            </div>
          </div>

          {/* Max Tokens */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Max Tokens
            </label>
            <input
              type="number"
              min={256}
              max={16384}
              step={256}
              value={maxTokens}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setMaxTokens(Math.max(256, Math.min(16384, v)));
              }}
              style={{
                display: "block", width: "100%", marginTop: 6, padding: "8px 10px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.card, color: T.text,
                fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
              생성할 최대 토큰 수 (256~16,384)
            </div>
          </div>

          {selected && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>모델 정보</div>
              {[
                ["ID",   selected.id],
                ["공급자", selected.provider],
                ["컨텍스트", `${(selected.contextLen / 1000).toFixed(0)}k tokens`],
                ["속도", selected.speed],
                ["비용", selected.cost],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: T.muted }}>{k}</span>
                  <span style={{ color: T.text, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 6 }}>자체 LM 학습</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              Dalkak 생성 코드 데이터로 파인튜닝 준비 중입니다. 출시 알림을 받으세요.
            </div>
            <button style={{ marginTop: 8, width: "100%", padding: "7px 0", borderRadius: 7, border: "none", background: T.purple, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              베타 신청 →
            </button>
          </div>
        </div>
      </div>
      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,0.95)', color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:600, zIndex:99999, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>{toast}</div>}
    </AppShell>
  );
}
