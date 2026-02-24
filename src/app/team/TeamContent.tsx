"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/utils/supabase/client";
import { getAuthUser } from "@/utils/supabase/auth";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = { id: number; name: string; role: string; online: boolean; color: string; initial: string };

type ChatMessage = {
  id: number | string;
  sender: string;
  senderColor: string;
  text: string;
  time: string;
  isAI?: boolean;
};

type DbMessage = {
  id: number;
  channel: string;
  user_name: string;
  user_id: string | null;
  text: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dbToChat(m: DbMessage): ChatMessage {
  return {
    id: m.id,
    sender: m.user_name,
    senderColor: "#3b82f6",
    text: m.text,
    time: new Date(m.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
  };
}

// ─── Static data ──────────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: 1, name: "나 (You)", role: "팀 오너", online: true, color: "#f97316", initial: "나" },
  { id: 2, name: "김민준", role: "풀스택 개발자", online: true, color: "#3b82f6", initial: "김" },
  { id: 3, name: "이서연", role: "UI/UX 디자이너", online: true, color: "#8b5cf6", initial: "이" },
  { id: 4, name: "박지호", role: "백엔드 개발자", online: false, color: "#6b7280", initial: "박" },
  { id: 5, name: "최예린", role: "데이터 분석가", online: false, color: "#6b7280", initial: "최" },
];

const CHANNELS = [
  { id: "general", label: "# general" },
  { id: "dev", label: "# 개발" },
  { id: "design", label: "# 디자인" },
  { id: "ai-lab", label: "# AI 실험실" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [aiMode, setAiMode] = useState<"openai" | "anthropic" | "gemini">("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState("general");
  const [userName, setUserName] = useState("나 (You)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };
  const isMobile = useMediaQuery("(max-width: 767px)");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load current user name
  useEffect(() => {
    getAuthUser().then(u => { if (u?.name) setUserName(u.name); });
  }, []);

  // Task 4: Validate activeChannel exists in CHANNELS; fall back to first channel if invalid
  useEffect(() => {
    if (!CHANNELS.some(ch => ch.id === activeChannel)) {
      setActiveChannel(CHANNELS[0].id);
    }
  }, [activeChannel]);

  // Load messages + subscribe to realtime
  const loadMessages = useCallback(async (channel: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("channel", channel)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) {
      setMessages(data.map(dbToChat));
    }
  }, []);

  useEffect(() => {
    setMessages([]);
    loadMessages(activeChannel);

    // Realtime subscription
    const sub = supabase
      .channel(`chat:${activeChannel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel=eq.${activeChannel}` },
        (payload) => {
          const m = payload.new as DbMessage;
          setMessages(prev => {
            // avoid duplicates
            if (prev.some(x => x.id === m.id)) return prev;
            return [...prev, dbToChat(m)];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChannel, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");

    // Save user message to Supabase
    const { error: insertErr } = await supabase.from("messages").insert([{
      channel: activeChannel,
      user_name: userName,
      text,
    }]);
    if (insertErr) {
      // Optimistic fallback: show locally if DB insert fails
      setMessages(prev => [...prev, {
        id: `local_${Date.now()}`, sender: userName,
        senderColor: "#f97316", text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }

    // AI response (local only — not saved to DB)
    setIsLoading(true);
    const aiPlaceholderId = `ai_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: aiPlaceholderId,
      sender: "F9 AI",
      senderColor: "#f97316",
      text: "",
      time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      isAI: true,
    }]);

    const STREAM_TIMEOUT_MS = 60_000;

    try {
      const apiKey = typeof window !== "undefined"
        ? localStorage.getItem(
            aiMode === "openai" ? "OPENAI_API_KEY"
            : aiMode === "anthropic" ? "ANTHROPIC_API_KEY"
            : "GOOGLE_GENERATIVE_AI_API_KEY"
          ) || undefined
        : undefined;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[팀 채팅 AI 어시스턴트] 채널: #${activeChannel}\n팀원 메시지: ${text}\n\n팀 협업 맥락에서 도움이 되는 답변을 한국어로 간결하게 해주세요.`,
          mode: aiMode,
          apiKey,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          showToast("API 키를 확인해주세요");
        } else if (res.status === 429) {
          showToast("API 호출 한도 초과");
        } else if (res.status >= 500) {
          showToast("AI 서비스 오류 — 잠시 후 다시 시도해주세요");
        } else {
          showToast(`AI 응답 오류 (${res.status})`);
        }
        setMessages(prev => prev.map(m =>
          m.id === aiPlaceholderId ? { ...m, text: "AI 응답 오류가 발생했습니다." } : m
        ));
        clearTimeout(timeoutId);
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let aiText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text: chunk } = JSON.parse(line.slice(6));
                aiText += chunk;
                setMessages(prev => prev.map(m => m.id === aiPlaceholderId ? { ...m, text: aiText } : m));
              } catch { /* skip */ }
            }
          }
        }
      }
      clearTimeout(timeoutId);
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      const errMsg = isTimeout
        ? "AI 응답 시간 초과 — 다시 시도해주세요"
        : "AI 연결 오류. /settings에서 API 키를 확인해주세요.";
      showToast(errMsg);
      setMessages(prev => prev.map(m =>
        m.id === aiPlaceholderId ? { ...m, text: errMsg } : m
      ));
    }
    setIsLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", position: "relative" }}>

        {/* Mobile sidebar backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 20 }}
          />
        )}

        {/* ─── Left Sidebar ─────────────────────────────── */}
        <div style={{
          width: 240, flexShrink: 0, background: "#f9fafb",
          borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
          overflow: "hidden",
          ...(isMobile ? {
            position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 21,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease-in-out",
            boxShadow: sidebarOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
          } : {}),
        }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1b1b1f", marginBottom: 2 }}>Dalkak Team</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#22c55e", marginRight: 5, verticalAlign: "middle" }} />
              멤버 {MEMBERS.filter(m => m.online).length}명 온라인
            </div>
          </div>

          {/* Channels */}
          <div style={{ padding: "12px 8px 8px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "0 8px", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>채널</div>
            {CHANNELS.map(ch => (
              <div
                key={ch.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveChannel(ch.id); if (isMobile) setSidebarOpen(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveChannel(ch.id); if (isMobile) setSidebarOpen(false); } }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 10px", borderRadius: 6, cursor: "pointer", fontSize: 14,
                  fontWeight: activeChannel === ch.id ? 600 : 400,
                  color: activeChannel === ch.id ? "#f97316" : "#374151",
                  background: activeChannel === ch.id ? "#fff7ed" : "transparent",
                  transition: "all 0.1s", minHeight: 44,
                }}
              >
                <span>{ch.label}</span>
              </div>
            ))}
          </div>

          {/* Members */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "0 8px", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>멤버</div>
            {MEMBERS.map(m => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: m.online ? m.color : "#e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, position: "relative",
                }}>
                  {m.initial}
                  <span style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 9, height: 9, borderRadius: "50%",
                    background: m.online ? "#22c55e" : "#9ca3af",
                    border: "1.5px solid #f9fafb",
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1f", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Chat Area ────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{
            padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#fff", flexShrink: 0, gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {isMobile && (
                <button onClick={() => setSidebarOpen(v => !v)} aria-label="사이드바 토글" style={{
                  width: 44, height: 44, borderRadius: 6, border: "1px solid #e5e7eb",
                  background: sidebarOpen ? "#fff7ed" : "#f9fafb", fontSize: 16, cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: sidebarOpen ? "#f97316" : "#374151",
                }}>
                  {sidebarOpen ? "\u2715" : "\u2630"}
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: "#1b1b1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  # {CHANNELS.find(c => c.id === activeChannel)?.label.replace("# ", "") || activeChannel}
                </div>
                {!isMobile && <div style={{ fontSize: 12, color: "#6b7280" }}>Supabase Realtime · AI 어시스턴트 자동 응답</div>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {isMobile && (
                <button onClick={() => setRightPanelOpen(v => !v)} aria-label="AI 도구 패널" style={{
                  width: 44, height: 44, borderRadius: 6, border: "1px solid #e5e7eb",
                  background: rightPanelOpen ? "#fff7ed" : "#f9fafb",
                  color: rightPanelOpen ? "#f97316" : "#374151",
                  fontSize: 16, cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  🧠
                </button>
              )}
            </div>
            <select
              value={aiMode}
              onChange={e => setAiMode(e.target.value as typeof aiMode)}
              aria-label="AI 모델 선택"
              style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                fontSize: 13, fontWeight: 600, color: "#374151", background: "#f9fafb",
                cursor: "pointer", outline: "none", minHeight: 44,
              }}
            >
              <option value="openai">🤖 GPT-3.5</option>
              <option value="anthropic">🟣 Claude</option>
              <option value="gemini">✨ Gemini</option>
            </select>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "12px" : "20px 24px", display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, paddingTop: 40 }}>
                아직 메시지가 없습니다. 첫 메시지를 보내보세요!
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: msg.isAI
                    ? "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)"
                    : msg.sender === userName ? "#f97316" : msg.senderColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: "#fff",
                }}>
                  {msg.isAI ? "AI" : msg.sender.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: msg.isAI ? "#f97316" : "#1b1b1f" }}>
                      {msg.sender}
                    </span>
                    {msg.isAI && (
                      <span style={{ fontSize: 10, background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>AI</span>
                    )}
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{msg.time}</span>
                  </div>
                  <div style={{
                    fontSize: 14, color: "#374151", lineHeight: 1.65, whiteSpace: "pre-wrap",
                    background: msg.isAI ? "#fff7ed" : "transparent",
                    padding: msg.isAI ? "10px 14px" : "0",
                    borderRadius: msg.isAI ? 8 : 0,
                    border: msg.isAI ? "1px solid #fed7aa" : "none",
                  }}>
                    {msg.text || (isLoading && msg.isAI ? <span style={{ color: "#9ca3af" }}>AI 응답 생성 중...</span> : "")}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: isMobile ? "8px 12px 12px" : "12px 20px 16px", borderTop: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
            <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="메시지를 보내세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
                style={{
                  width: "100%", padding: "12px 16px", border: "none", outline: "none",
                  resize: "none", fontSize: 14, color: "#1b1b1f", lineHeight: 1.6,
                  fontFamily: "inherit", background: "transparent",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#9ca3af", marginRight: "auto" }}>
                  Supabase Realtime 연동 · 실시간 동기화
                </span>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  style={{
                    padding: "8px 18px", borderRadius: 7, border: "none",
                    background: isLoading || !input.trim() ? "#e5e7eb" : "#f97316",
                    color: isLoading || !input.trim() ? "#9ca3af" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.15s", minHeight: 44,
                  }}
                >
                  {isLoading ? "전송 중..." : "전송 →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile right panel backdrop */}
        {isMobile && rightPanelOpen && (
          <div
            onClick={() => setRightPanelOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 20 }}
          />
        )}

        {/* ─── Right Panel ──────────────────────────────── */}
        <div style={{
          width: 220, flexShrink: 0, background: "#f9fafb",
          borderLeft: "1px solid #e5e7eb", padding: "16px 12px",
          display: isMobile && !rightPanelOpen ? "none" : "flex",
          flexDirection: "column", gap: 20, overflow: "auto",
          ...(isMobile ? {
            position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 21,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
          } : {}),
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>AI 도구</div>
            {[
              { emoji: "🧠", label: "코드 리뷰", prompt: "코드 리뷰: " },
              { emoji: "📝", label: "문서 요약", prompt: "문서 요약: " },
              { emoji: "🌐", label: "번역 지원", prompt: "다음을 영어로 번역해줘: " },
              { emoji: "🐛", label: "버그 분석", prompt: "버그 분석: " },
            ].map(tool => (
              <button
                key={tool.label}
                onClick={() => { setInput(tool.prompt); inputRef.current?.focus(); if (isMobile) setRightPanelOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 12px", borderRadius: 7, border: "1px solid #fed7aa",
                  background: "#fff7ed", fontSize: 13, color: "#f97316", cursor: "pointer",
                  marginBottom: 6, fontWeight: 500, textAlign: "left", minHeight: 44,
                }}
              >
                <span>{tool.emoji}</span>{tool.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "auto", padding: "12px", background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, color: "#9ca3af" }}>
            <div style={{ fontWeight: 700, color: "#6b7280", marginBottom: 4 }}>채널 통계</div>
            <div>메시지: {messages.filter(m => !m.isAI).length}개</div>
            <div>온라인: {MEMBERS.filter(m => m.online).length}/{MEMBERS.length}명</div>
            <div style={{ marginTop: 4, color: "#22c55e", fontWeight: 600 }}>● Realtime 연결됨</div>
          </div>
        </div>

      </div>
      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,0.95)', color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:600, zIndex:99999, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>{toast}</div>}
    </AppShell>
  );
}
