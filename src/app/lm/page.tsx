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

function ModelCard({ model, selected, onClick }: { model: LMModel; selected: boolean; onClick: () => void }) {
  const pc = PROVIDER_COLORS[model.provider] ?? T.muted;
  return (
    <div onClick={model.available ? onClick : undefined} style={{
      padding: "12px 14px", borderRadius: 12, cursor: model.available ? "pointer" : "default",
      border: `1px solid ${selected ? T.accent : T.border}`,
      background: selected ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.02)",
      opacity: model.available ? 1 : 0.4,
      transition: "border-color 0.15s, background 0.15s",
    }}>
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

  const send = useCallback(async () => {
    if (!input.trim() || !selected || streaming) return;
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
            } catch {}
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
  }, [input, selected, streaming, messages, system]);

  const stop = () => { abortRef.current?.abort(); setStreaming(false); };
  const clear = () => setMessages([]);

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
            {/* Ollama local models */}
            {ollamaModels.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", padding: "6px 2px 8px" }}>
                  로컬 모델 (Ollama)
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {ollamaModels.map(m => (
                    <ModelCard key={m.id} model={m} selected={selected?.id === m.id} onClick={() => setSelected(m)} />
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
                <ModelCard key={m.id} model={m} selected={selected?.id === m.id} onClick={() => setSelected(m)} />
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
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selected ? selected.name : "모델을 선택하세요"}</span>
              {selected && <span style={{ fontSize: 11, color: PROVIDER_COLORS[selected.provider] ?? T.muted, marginLeft: 8 }}>{selected.provider}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clear} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
                대화 초기화
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: T.muted, marginTop: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🤖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>Dalkak LM</div>
                <div style={{ fontSize: 13 }}>왼쪽에서 모델을 선택하고 대화를 시작하세요</div>
                {!selected && <div style={{ fontSize: 12, marginTop: 4, color: T.red }}>사용 가능한 모델이 없습니다 — API 키를 확인하세요</div>}
              </div>
            ) : messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
            {error && <div style={{ color: T.red, fontSize: 12, padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 8, marginBottom: 12 }}>{error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="메시지 입력... (Shift+Enter 줄바꿈, Enter 전송)"
              rows={2}
              disabled={!selected || streaming}
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
              <button onClick={send} disabled={!selected || !input.trim()} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: selected && input.trim() ? "linear-gradient(135deg, #f97316, #f43f5e)" : "rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: selected && input.trim() ? "pointer" : "default", flexShrink: 0,
              }}>
                전송
              </button>
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
