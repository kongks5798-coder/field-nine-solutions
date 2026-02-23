"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { T as _T } from "@/lib/theme";

const T = { ..._T, purple: "#a855f7" };

// Peer colors for cursors
const PEER_COLORS = ["#60a5fa", "#a855f7", "#22c55e", "#f43f5e", "#fbbf24", "#34d399"];

type Peer = { id: string; name: string; color: string; cursor?: { line: number; col: number } };
type Message = { id: string; from: string; color: string; text: string; ts: number };

// AI suggestions via stream
async function getAiSuggestion(code: string, instruction: string, onChunk: (t: string) => void) {
  const prompt = `You are an expert programmer. Given this code:\n\`\`\`\n${code.slice(0, 3000)}\n\`\`\`\nUser instruction: "${instruction}"\nProvide the improved/fixed code. Output ONLY the code, no explanation.`;
  const r = await fetch("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "anthropic", prompt }),
  });
  const reader = r.body?.getReader();
  const dec = new TextDecoder();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try { const t = JSON.parse(line.slice(6)).text; if (t) onChunk(t); } catch {}
      }
    }
  }
}

function PeerCursor({ peer }: { peer: Peer }) {
  if (!peer.cursor) return null;
  return (
    <div style={{ position: "absolute", pointerEvents: "none", zIndex: 10, fontSize: 11, color: peer.color, fontWeight: 700, left: `${peer.cursor.col * 8}px`, top: `${peer.cursor.line * 20}px` }}>
      <div style={{ width: 2, height: 18, background: peer.color, display: "inline-block", verticalAlign: "middle", marginRight: 2, animation: "blink 1s step-end infinite" }} />
      <span style={{ background: peer.color, color: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 10 }}>{peer.name}</span>
    </div>
  );
}

export default function DalkkakCollabPage() {
  const [code,       setCode]       = useState(`// Dalkak Collab — 실시간 AI 페어프로그래밍
// 이 편집기는 여러 명이 동시에 편집할 수 있습니다.

function greet(name) {
  return \`Hello, \${name}! Welcome to Dalkak Collab.\`;
}

const message = greet("World");
console.log(message);
`);
  const [peers,      setPeers]      = useState<Peer[]>([]);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [chatInput,  setChatInput]  = useState("");
  const [aiCmd,      setAiCmd]      = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiOutput,   setAiOutput]   = useState("");
  const [roomId,     setRoomId]     = useState("");
  const [myName,     setMyName]     = useState("");
  const [connected,  setConnected]  = useState(false);
  const [joining,    setJoining]    = useState(false);
  const editorRef  = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const wsRef      = useRef<WebSocket | null>(null);
  const myColor    = useRef(PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)]);
  const myId       = useRef(Math.random().toString(36).slice(2));

  // Simulate realtime with Supabase Broadcast (demo mode without actual WS)
  useEffect(() => {
    if (!connected) return;

    // Demo: simulate peers joining
    const demoTimer = setTimeout(() => {
      setPeers(prev => {
        if (prev.length > 0) return prev;
        return [
          { id: "demo1", name: "Alice", color: PEER_COLORS[0], cursor: { line: 4, col: 10 } },
          { id: "demo2", name: "Bob",   color: PEER_COLORS[1], cursor: { line: 7, col: 5  } },
        ];
      });
      setMessages(prev => [...prev, {
        id: "sys1", from: "시스템", color: T.muted, text: "Alice, Bob님이 참여했습니다.", ts: Date.now(),
      }]);
    }, 1500);

    return () => clearTimeout(demoTimer);
  }, [connected]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const joinRoom = () => {
    if (!myName.trim()) return;
    setJoining(true);
    setTimeout(() => {
      setConnected(true);
      setJoining(false);
      setMessages([{
        id: "sys0", from: "시스템", color: T.muted,
        text: `"${myName}"님이 룸 ${roomId || "dalkak-" + Math.random().toString(36).slice(2, 6)}에 접속했습니다.`,
        ts: Date.now(),
      }]);
    }, 800);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: Message = { id: Date.now().toString(), from: myName, color: myColor.current, text: chatInput, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const runAi = useCallback(async () => {
    if (!aiCmd.trim() || aiLoading) return;
    setAiLoading(true);
    setAiOutput("");
    try {
      let result = "";
      await getAiSuggestion(code, aiCmd, (chunk) => {
        result += chunk;
        setAiOutput(prev => prev + chunk);
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(), from: "Dalkak AI", color: T.accent,
        text: `"${aiCmd}" 명령 실행 완료`, ts: Date.now(),
      }]);
    } catch (e) {
      setAiOutput(`오류: ${(e as Error).message}`);
    } finally {
      setAiLoading(false);
    }
  }, [aiCmd, aiLoading, code]);

  const applyAiOutput = () => {
    if (!aiOutput) return;
    // Extract code from output
    const codeMatch = aiOutput.match(/```(?:\w+)?\n?([\s\S]+?)```/);
    const cleanCode = codeMatch ? codeMatch[1] : aiOutput;
    setCode(cleanCode);
    setAiOutput("");
    setAiCmd("");
    setMessages(prev => [...prev, {
      id: Date.now().toString(), from: "Dalkak AI", color: T.accent,
      text: "AI 코드를 에디터에 적용했습니다.", ts: Date.now(),
    }]);
  };

  if (!connected) {
    return (
      <AppShell>
        <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 40, maxWidth: 440, width: "90%" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 4 }}>Dalkak Collab</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 28 }}>실시간 AI 페어프로그래밍</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>내 이름</label>
              <input
                aria-label="내 이름"
                value={myName}
                onChange={e => setMyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinRoom()}
                placeholder="사용할 닉네임을 입력하세요"
                style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>룸 ID (비워두면 새 룸 생성)</label>
              <input
                aria-label="룸 ID"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="기존 룸 ID 입력 (선택사항)"
                style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button aria-label="룸 참여" onClick={joinRoom} disabled={!myName.trim() || joining} style={{
              width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #f97316, #f43f5e)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              {joining ? "접속 중..." : "룸 참여 →"}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        textarea:focus { outline: none; }
      `}</style>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, color: T.text, fontFamily: '"Pretendard", "Fira Code", monospace', overflow: "hidden" }}>

        {/* ── Editor ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}`, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>main.js</span>
            <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>{peers.length + 1}명 접속 중</span>
            {/* Peer avatars */}
            <div style={{ display: "flex", gap: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: myColor.current, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                {myName.charAt(0).toUpperCase()}
              </div>
              {peers.map(p => (
                <div key={p.id} style={{ width: 24, height: 24, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }} title={p.name}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Code editor */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Peer cursors overlay */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", padding: "12px 16px 12px 56px", fontFamily: '"Fira Code", monospace', fontSize: 14, lineHeight: "20px", zIndex: 5 }}>
              {peers.map(p => <PeerCursor key={p.id} peer={p} />)}
            </div>
            {/* Line numbers + textarea */}
            <div style={{ display: "flex", height: "100%", overflow: "auto" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", borderRight: `1px solid ${T.border}`, padding: "12px 8px", minWidth: 48, textAlign: "right", fontFamily: '"Fira Code", monospace', fontSize: 13, lineHeight: "20px", color: "#4b5563", userSelect: "none", flexShrink: 0 }}>
                {code.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                ref={editorRef}
                aria-label="코드 편집기"
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, padding: "12px 16px", background: "transparent", border: "none", color: T.text,
                  fontFamily: '"Fira Code", "Consolas", monospace', fontSize: 13, lineHeight: "20px",
                  resize: "none", height: "100%", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* AI command bar */}
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 700, flexShrink: 0 }}>⚡ AI</span>
            <input
              aria-label="AI 명령 입력"
              value={aiCmd}
              onChange={e => setAiCmd(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runAi()}
              placeholder='AI에게 명령: "버그 고쳐줘", "리팩토링 해줘", "함수 추가해줘"...'
              style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none" }}
            />
            <button aria-label="AI 명령 실행" onClick={runAi} disabled={aiLoading} style={{
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: aiLoading ? "rgba(249,115,22,0.3)" : T.accent,
              color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              {aiLoading ? "..." : "실행"}
            </button>
          </div>

          {/* AI output */}
          {aiOutput && (
            <div style={{ background: "rgba(168,85,247,0.06)", borderTop: `1px solid rgba(168,85,247,0.2)`, padding: 12, maxHeight: 200, overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.purple }}>AI 제안</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button aria-label="AI 제안 코드 적용" onClick={applyAiOutput} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "none", background: T.purple, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                    적용
                  </button>
                  <button aria-label="AI 제안 닫기" onClick={() => setAiOutput("")} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>
                    닫기
                  </button>
                </div>
              </div>
              <pre style={{ fontSize: 12, color: T.text, margin: 0, fontFamily: '"Fira Code", monospace', lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{aiOutput}</pre>
            </div>
          )}
        </div>

        {/* ── Chat ── */}
        <div style={{ width: 280, background: T.surface, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>채팅</div>
            <div style={{ fontSize: 11, color: T.muted }}>{myName} · {peers.length + 1}명</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                <div style={{ fontSize: 10, color: msg.color, fontWeight: 700, marginBottom: 2 }}>{msg.from}</div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
            <input
              aria-label="채팅 메시지 입력"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendChat()}
              placeholder="메시지 입력..."
              style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, color: T.text, fontSize: 12, outline: "none" }}
            />
            <button aria-label="채팅 전송" onClick={sendChat} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              전송
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
