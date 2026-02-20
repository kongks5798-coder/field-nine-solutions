"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

type ActionState = "pending" | "running" | "done" | "error";
type ActionKind  = "cmd" | "task";
type LogLevel    = "log" | "warn" | "error" | "info";
type RightView   = "preview" | "code";

type ActionItem = { id: string; text: string; state: ActionState; kind: ActionKind };
type LogLine    = { level: LogLevel; msg: string; ts: string };
type Message    = {
  id: string; role: "user" | "agent"; text: string;
  tag?: string; actions?: ActionItem[]; checkpoint?: string;
  elapsed?: number; ts: string;
};

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert full-stack web developer AI agent. Build a complete, self-contained HTML web application.
RULES:
1. Return ONLY a complete HTML file starting with <!DOCTYPE html>
2. Include ALL CSS inside <style> tags in the <head>
3. Include ALL JavaScript inside <script> tags at the bottom of <body>
4. Beautiful modern UI — gradients, shadows, smooth animations, clean typography
5. Fully functional and interactive. Use local storage for persistence where appropriate.
6. Vanilla HTML/CSS/JS only. CDN libraries (Tailwind CDN, Chart.js, Animate.css, Font Awesome) OK.
7. Korean language support in UI where relevant.
8. CRITICAL: Return ONLY the HTML. No explanation, no markdown, no code blocks.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractHTML(raw: string): string {
  const m1 = raw.match(/```html\s*\n?([\s\S]*?)\n?```/i);
  if (m1) return m1[1].trim();
  const m2 = raw.match(/```\s*\n?([\s\S]*?)\n?```/);
  if (m2) return m2[1].trim();
  const t = raw.trim();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) return t;
  const i = raw.indexOf("<!DOCTYPE");
  if (i !== -1) return raw.slice(i).trim();
  return raw;
}

function injectCapture(html: string): string {
  const s = `<script>(function(){
var p=function(d){try{window.parent.postMessage(Object.assign({type:'F9'},d),'*')}catch(e){}};
window.onerror=function(m,_,l,c,err){p({level:'error',msg:m+' (line '+l+')'}); return false};
window.addEventListener('unhandledrejection',function(e){p({level:'error',msg:'Promise: '+(e.reason||e)})});
['log','warn','error','info'].forEach(function(k){var o=console[k];console[k]=function(){
  p({level:k,msg:Array.prototype.slice.call(arguments).join(' ')});o.apply(console,arguments)};});
})()</script>`;
  if (html.includes("<head>")) return html.replace("<head>", "<head>"+s);
  if (html.includes("<body>")) return html.replace("<body>", "<body>"+s);
  return s+html;
}

function uid()  { return Math.random().toString(36).slice(2,9); }
function ts()   { return new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}); }
function hms(s: number) { return s < 60 ? `${s}초` : `${Math.floor(s/60)}분 ${s%60}초`; }

function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.focus(); el.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand("copy");
      document.body.removeChild(el);
    } catch {}
  });
}

// ── Micro components ─────────────────────────────────────────────────────────

function CheckCircle({ size=18 }: { size?: number }) {
  return (
    <div style={{ width:size,height:size,borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      <svg width={size*0.5} height={size*0.4} viewBox="0 0 10 8" fill="none">
        <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function Spinner({ size=18, color="#f97316" }: { size?: number; color?: string }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",border:`2px solid ${color}33`,borderTopColor:color,animation:"spin 0.7s linear infinite",flexShrink:0 }} />;
}

function PendingDot({ size=18 }: { size?: number }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",border:"2px solid #e4e4e7",flexShrink:0 }} />;
}

function DotsGrid({ animated }: { animated: boolean }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:18 }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5 }}>
        {Array.from({length:6},(_,i)=>(
          <div key={i} style={{ width:13,height:13,borderRadius:"50%",background:"#d4d4d8",
            animation: animated ? `dotPulse 1.6s ${i*0.15}s ease-in-out infinite` : "none",
            opacity: animated ? 1 : 0.4 }} />
        ))}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:15,fontWeight:600,color:"#71717a",marginBottom:4 }}>
          {animated ? "빌드 중..." : "미리보기가 여기에 표시됩니다"}
        </div>
        <div style={{ fontSize:13,color:"#a1a1aa" }}>
          {animated ? "AI가 앱을 만들고 있어요..." : "아래에 원하는 앱을 입력해보세요"}
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2200); return () => clearTimeout(t); }, [onHide]);
  return (
    <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
      background:"#18181b",color:"#fff",padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:500,
      boxShadow:"0 4px 20px rgba(0,0,0,0.25)",zIndex:9999,animation:"fadeUp 0.25s ease",whiteSpace:"nowrap" }}>
      {msg}
    </div>
  );
}

// ── Agent Page ────────────────────────────────────────────────────────────────

function AgentPage() {
  const router = useRouter();
  const params  = useSearchParams();
  const promptQ = params?.get("q") || "";
  const aiMode  = params?.get("mode") || "openai";

  // Chat & generation
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [generating,  setGenerating]  = useState(false);
  const [input,       setInput]       = useState("");
  const [elapsed,     setElapsed]     = useState(0);

  // Preview
  const [previewHTML, setPreviewHTML] = useState("");
  const [currentHTML, setCurrentHTML] = useState("");
  const [iframeKey,   setIframeKey]   = useState(0);
  const [rightView,   setRightView]   = useState<RightView>("preview");
  const [logs,        setLogs]        = useState<LogLine[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullscreen,setIsFullscreen]= useState(false);

  // Layout
  const [leftOpen,    setLeftOpen]    = useState(true);
  const [leftW,       setLeftW]       = useState(370);
  const [dragging,    setDragging]    = useState(false);

  // Rating
  const [showRating,  setShowRating]  = useState(false);
  const [hoverStar,   setHoverStar]   = useState(0);
  const [givenStar,   setGivenStar]   = useState(0);
  const [ratedDone,   setRatedDone]   = useState(false);

  // Project name
  const [projName,    setProjName]    = useState("");
  const [editingName, setEditingName] = useState(false);

  // Toast
  const [toast, setToast] = useState("");

  // Refs
  const endRef      = useRef<HTMLDivElement>(null);
  const startedRef  = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setInterval>|null>(null);
  const elapsedRef  = useRef(0);
  const abortRef    = useRef<AbortController|null>(null);
  const nameRef     = useRef<HTMLInputElement>(null);
  const bodyRef     = useRef<HTMLDivElement>(null);

  const displayName = projName || (promptQ ? promptQ.slice(0,26)+(promptQ.length>26?"...":"") : "새 프로젝트");
  const errorCount  = logs.filter(l => l.level === "error").length;
  const actionDone  = messages.reduce((n,m)=>n+(m.actions?.filter(a=>a.state==="done").length??0),0);

  // Auto scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, showRating]);

  // Focus name input
  useEffect(() => { if (editingName) setTimeout(()=>nameRef.current?.select(), 50); }, [editingName]);

  // Listen to iframe
  useEffect(() => {
    const h = (e: MessageEvent) => {
      if (e.data?.type !== "F9") return;
      const line: LogLine = { level: e.data.level as LogLevel, msg: String(e.data.msg), ts: new Date().toLocaleTimeString() };
      setLogs(p => [...p.slice(-499), line]);
      if (e.data.level === "error") setShowConsole(true);
    };
    window.addEventListener("message", h);
    return () => window.removeEventListener("message", h);
  }, []);

  // Drag resize left panel
  const startDragPanel = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const onMove = (ev: MouseEvent) => {
      setLeftW(Math.min(Math.max(ev.clientX, 260), 580));
    };
    const onUp = () => {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // Auto start
  useEffect(() => {
    if (promptQ && !startedRef.current) { startedRef.current = true; runAgent(promptQ, true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptQ]);

  // ── Message helpers ────────────────────────────────────────────────────────

  const addMsg = (m: Omit<Message,"id"|"ts">) => {
    const msg = { ...m, id: uid(), ts: ts() };
    setMessages(p => [...p, msg]);
    return msg.id;
  };

  const patchMsg = (id: string, fn: (m: Message) => Message) =>
    setMessages(p => p.map(m => m.id === id ? fn(m) : m));

  const patchActions = (id: string, fn: (a: ActionItem[]) => ActionItem[]) =>
    patchMsg(id, m => ({ ...m, actions: m.actions ? fn(m.actions) : m.actions }));

  // ── Core generation ────────────────────────────────────────────────────────

  const runAgent = async (prompt: string, first: boolean) => {
    setGenerating(true);
    setShowRating(false);
    setGivenStar(0);
    setRatedDone(false);
    setLogs([]);
    elapsedRef.current = 0;
    setElapsed(0);

    if (first) addMsg({ role:"user", text:prompt, tag:"Web app" });

    const agentId = uid();
    const initActions: ActionItem[] = [
      { id:"c0", text:"Configured Start application to run npm run dev", state:"done",    kind:"cmd"  },
      { id:"a1", text:"앱 구조 및 요구사항 분석",                          state:"running", kind:"task" },
      { id:"a2", text:"HTML / CSS 레이아웃 및 디자인 작성",                state:"pending", kind:"task" },
      { id:"a3", text:"JavaScript 기능 구현 및 최종 완성",                 state:"pending", kind:"task" },
    ];
    setMessages(p => [...p, { id:agentId, role:"agent", text:"", actions:initActions, ts:ts() }]);

    timerRef.current = setInterval(() => { elapsedRef.current++; setElapsed(elapsedRef.current); }, 1000);

    const advance = (upTo: number, delay: number) => setTimeout(() => {
      patchActions(agentId, acts => acts.map((a, i) =>
        i < upTo    ? { ...a, state:"done"    as ActionState } :
        i === upTo  ? { ...a, state:"running" as ActionState } : a
      ));
    }, delay);

    advance(2, 2000);
    advance(3, 4200);

    try {
      abortRef.current = new AbortController();
      const context = !first && currentHTML
        ? `\n\nCurrent HTML (apply the modification, return full updated HTML):\n${currentHTML.slice(0,12000)}\n\nModification request: ${prompt}`
        : `\n\nBuild this app: ${prompt}`;

      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: SYSTEM_PROMPT + context, mode: aiMode }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try { const { text } = JSON.parse(line.slice(6)); acc += text; } catch {}
            }
          }
        }
      }

      const html = extractHTML(acc);
      setCurrentHTML(html);
      setPreviewHTML(injectCapture(html));
      setIframeKey(k => k + 1);
      setRightView("preview");
      patchActions(agentId, acts => acts.map(a => ({ ...a, state:"done" as ActionState })));

    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        patchActions(agentId, acts => acts.map(a => a.state==="running" ? { ...a, state:"error" as ActionState } : a));
        addMsg({ role:"agent", text:"생성이 취소됐습니다." });
        if (timerRef.current) clearInterval(timerRef.current);
        setGenerating(false);
        return;
      }
      patchActions(agentId, acts => acts.map(a => ({ ...a, state:"done" as ActionState })));
      addMsg({ role:"agent", text:"⚠️ AI 연결 오류\n\n/settings 에서 API 키를 확인해주세요." });
    }

    if (timerRef.current) clearInterval(timerRef.current);
    const took = elapsedRef.current;

    addMsg({
      role:"agent",
      text: first
        ? "앱 개발이 완료됐습니다!\n\n오른쪽 미리보기에서 확인해보세요. 수정이 필요하거나 기능을 추가하고 싶으면 아래에 입력해주세요."
        : "수정이 반영됐습니다! 미리보기를 확인해보세요.",
      checkpoint: "지금 완료",
      elapsed: took,
    });

    setGenerating(false);
    setShowRating(true);
  };

  const cancelGeneration = () => { abortRef.current?.abort(); };

  const handleSend = async () => {
    const t = input.trim();
    if (!t || generating) return;
    setInput("");
    addMsg({ role:"user", text:t });
    await runAgent(t, false);
  };

  // ── Preview controls ───────────────────────────────────────────────────────

  const refreshPreview = () => {
    if (!currentHTML) return;
    setLogs([]);
    setPreviewHTML(injectCapture(currentHTML));
    setIframeKey(k => k + 1);
  };

  const downloadHTML = () => {
    if (!currentHTML) return;
    const blob = new Blob([currentHTML], { type:"text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${displayName.replace(/[^a-zA-Z0-9가-힣 ]/g,"_").trim() || "app"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("HTML 파일 다운로드 완료");
  };

  const openNewTab = () => {
    if (!currentHTML) return;
    const blob = new Blob([injectCapture(currentHTML)], { type:"text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const copyCode = () => {
    if (!currentHTML) return;
    copyText(currentHTML);
    showToast("코드 복사 완료");
  };

  const showToast = (msg: string) => { setToast(msg); };

  const logColor = (l: LogLevel) =>
    l==="error" ? "#f87171" : l==="warn" ? "#fb923c" : l==="info" ? "#60a5fa" : "#94a3b8";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={bodyRef} style={{ display:"flex",flexDirection:"column",height:"100vh",background:"#fff",
      color:"#1a1a1a",fontFamily:'"Pretendard",Inter,-apple-system,sans-serif',overflow:"hidden",
      cursor: dragging ? "col-resize" : "default", userSelect: dragging ? "none" : "auto" }}>

      {/* ══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <div style={{ display:"flex",alignItems:"center",height:50,background:"#fff",
        borderBottom:"1px solid #e4e4e7",flexShrink:0,padding:"0 10px 0 8px",gap:5,zIndex:20 }}>

        {/* Hamburger */}
        <button onClick={()=>setLeftOpen(o=>!o)}
          title={leftOpen?"사이드패널 숨기기":"사이드패널 열기"}
          style={{ background:"none",border:"none",color:"#71717a",cursor:"pointer",
            padding:"5px 7px",fontSize:18,lineHeight:1,borderRadius:6,flexShrink:0,
            transition:"color 0.15s" }}>≡</button>

        {/* Logo */}
        <div onClick={()=>router.push("/")} title="홈으로"
          style={{ width:28,height:28,borderRadius:7,
            background:"linear-gradient(135deg,#f97316 0%,#f43f5e 100%)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:900,fontSize:11,color:"#fff",cursor:"pointer",flexShrink:0 }}>F9</div>

        <div style={{ width:1,height:20,background:"#e4e4e7",margin:"0 3px",flexShrink:0 }} />

        {/* Project name (editable) */}
        {editingName ? (
          <input ref={nameRef} value={projName}
            onChange={e=>setProjName(e.target.value)}
            onBlur={()=>setEditingName(false)}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape") setEditingName(false); }}
            placeholder={promptQ.slice(0,26)||"프로젝트 이름"}
            style={{ fontSize:14,fontWeight:700,color:"#1a1a1a",background:"#f4f4f5",
              border:"1px solid #e4e4e7",borderRadius:6,padding:"3px 8px",outline:"none",
              maxWidth:200,fontFamily:"inherit" }} />
        ) : (
          <span onClick={()=>setEditingName(true)} title="클릭하여 이름 변경"
            style={{ fontSize:14,fontWeight:700,color:"#1a1a1a",flexShrink:0,
              maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              cursor:"text",padding:"2px 4px",borderRadius:4,transition:"background 0.15s" }}>
            {displayName}
          </span>
        )}

        {/* Play/Re-run */}
        <button onClick={()=>refreshPreview()} disabled={!currentHTML||generating}
          title="앱 재실행"
          style={{ width:26,height:26,borderRadius:"50%",
            background:!currentHTML||generating?"#e4e4e7":"#18181b",
            border:"none",color:"#fff",cursor:!currentHTML||generating?"not-allowed":"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            transition:"background 0.15s" }}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 1l8 4-8 4z"/></svg>
        </button>

        <div style={{ flex:1 }} />

        {/* AI mode badge */}
        <div style={{ padding:"3px 8px",borderRadius:20,background:"#f4f4f5",
          border:"1px solid #e4e4e7",fontSize:11,color:"#71717a",fontWeight:500,flexShrink:0 }}>
          {aiMode==="openai"?"GPT-4o mini":aiMode==="anthropic"?"Claude 3.5":aiMode==="grok"?"Grok 3":"Gemini"}
        </div>

        {/* Preview tab */}
        <div style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
          borderRadius:8,background:"#f4f4f5",border:"1px solid #e4e4e7",
          fontSize:13,color:"#1a1a1a",fontWeight:500,flexShrink:0 }}>
          <span>미리보기</span>
          <button onClick={()=>router.push("/")}
            style={{ background:"none",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:13,lineHeight:1,padding:0 }}>×</button>
        </div>

        {/* + */}
        <button style={{ width:32,height:32,borderRadius:8,border:"1px solid #e4e4e7",
          background:"none",color:"#71717a",cursor:"pointer",display:"flex",
          alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0 }}>+</button>

        {/* Search */}
        <button style={{ width:32,height:32,borderRadius:8,border:"none",background:"none",
          color:"#71717a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/>
          </svg>
        </button>

        {/* Avatar */}
        <div style={{ width:28,height:28,borderRadius:"50%",
          background:"linear-gradient(135deg,#f97316 0%,#f43f5e 100%)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:10,color:"#fff",fontWeight:700,cursor:"pointer",flexShrink:0 }}>F9</div>

        {/* Publish = Download */}
        <button onClick={downloadHTML} disabled={!currentHTML}
          style={{ padding:"6px 14px",borderRadius:8,
            background:currentHTML?"#0079f1":"#c0c0d0",
            color:"#fff",border:"none",fontSize:13,fontWeight:600,
            cursor:currentHTML?"pointer":"not-allowed",fontFamily:"inherit",flexShrink:0,
            transition:"background 0.15s" }}>
          {currentHTML ? "↓ 다운로드" : "배포하기"}
        </button>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════════ */}
      <div style={{ display:"flex",flex:1,overflow:"hidden" }}>

        {/* ── LEFT: Chat panel (resizable) ───────────────────────────── */}
        {leftOpen && (
          <div style={{ width:leftW,minWidth:260,display:"flex",flexDirection:"column",
            borderRight:"1px solid #e4e4e7",background:"#fff",overflow:"hidden",flexShrink:0,
            position:"relative" }}>

            {/* Session header */}
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"9px 14px",borderBottom:"1px solid #f0f0f3",flexShrink:0 }}>
              <span title={promptQ} style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220 }}>
                {displayName}
              </span>
              <div style={{ display:"flex",gap:1,flexShrink:0 }}>
                <button title="대화 기록" style={{ background:"none",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:16,padding:"3px 5px",borderRadius:5 }}>🕐</button>
                <button title="북마크" style={{ background:"none",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:16,padding:"3px 5px",borderRadius:5 }}>🔖</button>
                <button title="새 대화" onClick={()=>{ setMessages([]); setPreviewHTML(""); setCurrentHTML(""); setShowRating(false); }}
                  style={{ background:"none",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:14,padding:"3px 5px",borderRadius:5 }}>＋</button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1,overflowY:"auto",padding:"14px 14px 6px",
              display:"flex",flexDirection:"column",gap:20 }}>

              {messages.length === 0 && (
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  flex:1,gap:10,color:"#a1a1aa",padding:"40px 20px",textAlign:"center" }}>
                  <div style={{ fontSize:32 }}>💬</div>
                  <div style={{ fontSize:14,fontWeight:600,color:"#71717a" }}>FieldNine Agent</div>
                  <div style={{ fontSize:12,lineHeight:1.6 }}>무엇을 만들고 싶으신가요?<br/>아래에 입력해주세요.</div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    /* ─ User bubble ─ */
                    <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                      {msg.tag && (
                        <div style={{ display:"flex",alignItems:"center",gap:5,padding:"3px 10px",
                          borderRadius:20,background:"#eff6ff",fontSize:11,color:"#3b82f6",
                          fontWeight:600,border:"1px solid #bfdbfe" }}>
                          🌐 {msg.tag}
                        </div>
                      )}
                      <div style={{ background:"#18181b",color:"#fff",
                        borderRadius:"18px 18px 4px 18px",padding:"10px 14px",
                        fontSize:13,lineHeight:1.6,maxWidth:"90%",wordBreak:"break-word" }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize:10,color:"#c4c4cc" }}>{msg.ts}</span>
                    </div>
                  ) : (
                    /* ─ Agent message ─ */
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {/* Avatar */}
                      <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                        <div style={{ width:22,height:22,borderRadius:"50%",
                          background:"linear-gradient(135deg,#f97316 0%,#f43f5e 100%)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:9,color:"#fff",fontWeight:700,flexShrink:0 }}>F9</div>
                        <span style={{ fontSize:11,fontWeight:700,color:"#71717a" }}>FieldNine Agent</span>
                        <span style={{ fontSize:10,color:"#c4c4cc" }}>{msg.ts}</span>
                        {msg.actions?.some(a=>a.state==="running") && (
                          <span style={{ fontSize:10,color:"#a1a1aa" }}>· {elapsed}초 소요</span>
                        )}
                      </div>

                      {/* Text */}
                      {msg.text && (
                        <div style={{ fontSize:13,color:"#1a1a1a",lineHeight:1.65,
                          paddingLeft:29,whiteSpace:"pre-line" }}>
                          {msg.text}
                        </div>
                      )}

                      {/* Actions */}
                      {msg.actions && (
                        <div style={{ paddingLeft:29,display:"flex",flexDirection:"column",gap:5 }}>
                          {msg.actions.map(a => (
                            <div key={a.id} style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                              {a.state==="done"    ? <CheckCircle size={17} /> :
                               a.state==="running" ? <Spinner size={17} />    :
                               a.state==="error"   ? <div style={{ width:17,height:17,borderRadius:"50%",background:"#fef2f2",border:"2px solid #f87171",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><span style={{ color:"#f87171",fontSize:9 }}>✕</span></div> :
                                                     <PendingDot size={17} />}
                              <span style={{
                                fontSize: a.kind==="cmd" ? 11 : 12,
                                color: a.state==="pending" ? "#c4c4cc" : a.state==="running" ? "#1a1a1a" : "#71717a",
                                fontWeight: a.state==="running" ? 600 : 400,
                                fontFamily: a.kind==="cmd" ? '"JetBrains Mono","Fira Code",monospace' : "inherit",
                                paddingTop: 1,
                                lineHeight: 1.4,
                              }}>
                                {a.kind==="cmd" ? `$ ${a.text}` : a.text}
                              </span>
                            </div>
                          ))}
                          {msg.actions.some(a=>a.state==="running") && (
                            <div style={{ display:"flex",alignItems:"center",gap:6,paddingTop:2 }}>
                              <div style={{ display:"flex",gap:3 }}>
                                {[0,1,2].map(i=>(
                                  <div key={i} style={{ width:5,height:5,borderRadius:"50%",
                                    background:"#d4d4d8",animation:`dotBounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
                                ))}
                              </div>
                              <span style={{ fontSize:11,color:"#a1a1aa" }}>생성 중...</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checkpoint */}
                      {msg.checkpoint && (
                        <div style={{ paddingLeft:29,display:"flex",flexDirection:"column",gap:3 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#71717a" }}>
                            <div style={{ width:16,height:16,borderRadius:"50%",background:"#f0fdf4",
                              border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                              <div style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e" }} />
                            </div>
                            Checkpoint: {msg.checkpoint}
                          </div>
                          {(msg.elapsed??0)>0 && (
                            <div style={{ paddingLeft:23,fontSize:12,color:"#a1a1aa",display:"flex",alignItems:"center",gap:5 }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 2"/></svg>
                              {hms(msg.elapsed??0)} 소요
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Rating panel */}
              {showRating && !ratedDone && (
                <div style={{ border:"1.5px solid #e4e4e7",borderRadius:12,padding:"14px 16px",
                  background:"#fff",boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
                    <span style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>결과가 마음에 드셨나요?</span>
                    <button onClick={()=>setShowRating(false)}
                      style={{ background:"none",border:"none",color:"#a1a1aa",cursor:"pointer",fontSize:17,lineHeight:1 }}>×</button>
                  </div>
                  <div style={{ fontSize:12,color:"#71717a",marginBottom:12 }}>이번 작업 결과를 별점으로 평가해주세요</div>
                  <div style={{ display:"flex",gap:4,justifyContent:"center",marginBottom:14 }}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n}
                        onMouseEnter={()=>setHoverStar(n)}
                        onMouseLeave={()=>setHoverStar(0)}
                        onClick={()=>setGivenStar(n)}
                        style={{ background:"none",border:"none",cursor:"pointer",
                          fontSize:26,color:n<=(hoverStar||givenStar)?"#f59e0b":"#e4e4e7",
                          padding:"0 3px",transition:"color 0.1s",lineHeight:1 }}>★</button>
                    ))}
                  </div>
                  <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                    <button onClick={()=>setShowRating(false)}
                      style={{ padding:"6px 16px",borderRadius:8,border:"1px solid #e4e4e7",
                        background:"#fff",color:"#71717a",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>취소</button>
                    <button onClick={()=>{ if(givenStar>0){ setRatedDone(true); showToast(`⭐ ${givenStar}점 평가 완료!`); }}}
                      disabled={givenStar===0}
                      style={{ padding:"6px 16px",borderRadius:8,border:"none",
                        background:givenStar>0?"#18181b":"#e4e4e7",
                        color:givenStar>0?"#fff":"#a1a1aa",fontSize:12,
                        cursor:givenStar>0?"pointer":"not-allowed",fontFamily:"inherit",
                        transition:"all 0.15s" }}>확인</button>
                  </div>
                </div>
              )}
              {ratedDone && (
                <div style={{ textAlign:"center",fontSize:12,color:"#a1a1aa" }}>
                  {"⭐".repeat(givenStar)} 평가해주셔서 감사합니다!
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div style={{ padding:"10px 12px 14px",borderTop:"1px solid #e4e4e7",flexShrink:0 }}>
              <div style={{ background:"#f4f4f5",borderRadius:14,border:"1px solid #e4e4e7",overflow:"hidden",
                boxShadow:"inset 0 1px 3px rgba(0,0,0,0.04)" }}>
                <textarea
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); } }}
                  placeholder="수정하거나 새로 만들 내용을 입력하세요..."
                  disabled={generating}
                  rows={3}
                  style={{ width:"100%",padding:"12px 14px 6px",background:"none",border:"none",
                    outline:"none",resize:"none",fontSize:13,color:"#1a1a1a",fontFamily:"inherit",
                    lineHeight:1.55 }}
                />
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px 10px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                    {generating ? (
                      <button onClick={cancelGeneration}
                        style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
                          borderRadius:7,border:"1px solid #fecaca",background:"#fef2f2",
                          color:"#ef4444",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                        ⬛ 중지
                      </button>
                    ) : (
                      <button style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
                        borderRadius:7,border:"1px solid #e4e4e7",background:"#fff",
                        color:"#1a1a1a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="#f97316">
                          <path d="M6 1l1.5 3H11l-2.75 2 1 3L6 7.5 2.75 9l1-3L1 4h3.5z"/>
                        </svg>
                        빌드
                        <span style={{ fontSize:10,color:"#a1a1aa" }}>▾</span>
                      </button>
                    )}
                    <button style={{ width:30,height:30,borderRadius:7,border:"none",
                      background:"none",color:"#71717a",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>📎</button>
                    {actionDone > 0 && (
                      <span style={{ fontSize:11,color:"#a1a1aa",paddingLeft:2 }}>{actionDone}개 완료</span>
                    )}
                  </div>
                  {/* Send */}
                  <button onClick={handleSend} disabled={!input.trim()||generating}
                    title="전송 (Enter)"
                    style={{ width:32,height:32,borderRadius:"50%",
                      background:!input.trim()||generating?"#e4e4e7":"#f97316",
                      border:"none",color:"#fff",
                      cursor:!input.trim()||generating?"not-allowed":"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      transition:"background 0.15s",flexShrink:0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 11V1M1 6l5-5 5 5"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div style={{ fontSize:10,color:"#c4c4cc",marginTop:6,textAlign:"center" }}>
                Enter로 전송 · Shift+Enter로 줄바꿈
              </div>
            </div>

            {/* Drag handle */}
            <div onMouseDown={startDragPanel}
              style={{ position:"absolute",right:0,top:0,bottom:0,width:4,cursor:"col-resize",
                background: dragging?"#f97316":"transparent",zIndex:10,transition:"background 0.15s" }} />
          </div>
        )}

        {/* ── RIGHT: Preview / Code ─────────────────────────────────── */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",background:"#f8f8f8",
          overflow:"hidden",position:"relative",
          ...(isFullscreen?{position:"fixed",inset:0,zIndex:50,background:"#fff"}:{}) }}>

          {/* Preview header bar */}
          <div style={{ display:"flex",alignItems:"center",height:42,background:"#fff",
            borderBottom:"1px solid #e4e4e7",flexShrink:0,padding:"0 10px",gap:6 }}>

            {/* Browser controls */}
            <div style={{ display:"flex",gap:4,flexShrink:0 }}>
              <div style={{ width:11,height:11,borderRadius:"50%",background:"#f85149",cursor:"pointer" }}
                onClick={()=>router.push("/")} />
              <div style={{ width:11,height:11,borderRadius:"50%",background:"#f0883e" }} />
              <div style={{ width:11,height:11,borderRadius:"50%",background:"#3fb950",cursor:"pointer" }}
                onClick={refreshPreview} />
            </div>

            {/* Refresh */}
            <button onClick={refreshPreview} disabled={!currentHTML}
              style={{ background:"none",border:"none",color:"#a1a1aa",cursor:currentHTML?"pointer":"not-allowed",
                fontSize:16,padding:"3px 5px",borderRadius:5,lineHeight:1,flexShrink:0 }}>⟳</button>

            {/* URL bar */}
            <div style={{ flex:1,background:"#f4f4f5",borderRadius:6,padding:"4px 10px",
              fontSize:11,color:"#71717a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              border:"1px solid #e4e4e7" }}>
              {currentHTML ? `preview › ${displayName}.html` : "fieldnine.io"}
            </div>

            {/* Copy code */}
            <button onClick={copyCode} disabled={!currentHTML} title="코드 복사"
              style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,
                border:"1px solid #e4e4e7",background:currentHTML?"#fff":"#f4f4f5",
                color:currentHTML?"#374151":"#a1a1aa",fontSize:11,fontWeight:500,cursor:currentHTML?"pointer":"not-allowed",
                fontFamily:"inherit",flexShrink:0,transition:"all 0.15s" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="3" width="7" height="7" rx="1.5"/>
                <path d="M3 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H8"/>
              </svg>
              복사
            </button>

            {/* Code toggle */}
            <button onClick={()=>setRightView(v=>v==="preview"?"code":"preview")} disabled={!currentHTML}
              title="코드 보기"
              style={{ display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,
                border:`1px solid ${rightView==="code"?"#f97316":"#e4e4e7"}`,
                background: rightView==="code" ? "#fff7ed" : currentHTML?"#fff":"#f4f4f5",
                color: rightView==="code" ? "#f97316" : currentHTML?"#374151":"#a1a1aa",
                fontSize:11,fontWeight: rightView==="code"?700:500,
                cursor:currentHTML?"pointer":"not-allowed",fontFamily:"inherit",flexShrink:0,transition:"all 0.15s" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2L1 5.5l2 3.5M8 2l2 3.5-2 3.5M5.5 1l-1 9"/>
              </svg>
              {rightView==="code"?"미리보기":"코드"}
            </button>

            {/* New tab */}
            <button onClick={openNewTab} disabled={!currentHTML} title="새 탭에서 열기"
              style={{ width:30,height:30,borderRadius:6,border:"1px solid #e4e4e7",
                background:currentHTML?"#fff":"#f4f4f5",color:currentHTML?"#374151":"#a1a1aa",
                cursor:currentHTML?"pointer":"not-allowed",display:"flex",alignItems:"center",
                justifyContent:"center",flexShrink:0,transition:"all 0.15s" }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V6.5M7 1h3v3M10 1L5 6"/>
              </svg>
            </button>

            {/* Fullscreen */}
            <button onClick={()=>setIsFullscreen(f=>!f)} title="전체화면"
              style={{ width:30,height:30,borderRadius:6,border:"1px solid #e4e4e7",
                background:isFullscreen?"#f4f4f5":"#fff",color:"#71717a",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {isFullscreen ? (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 4h3V1M10 4H7V1M1 7h3v3M10 7H7v3"/></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 4V1h3M7 1h3v3M10 7v3H7M4 10H1V7"/></svg>
              )}
            </button>
          </div>

          {/* Content area */}
          <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
            {rightView === "code" && currentHTML ? (
              /* ─ Code view ─ */
              <div style={{ flex:1,overflow:"auto",background:"#0f0f17",padding:"16px",position:"relative" }}>
                <pre style={{ margin:0,fontSize:12,lineHeight:1.7,color:"#cdd6f4",fontFamily:'"JetBrains Mono","Fira Code","Cascadia Code",monospace',whiteSpace:"pre-wrap",wordBreak:"break-all" }}>
                  {currentHTML}
                </pre>
              </div>
            ) : (
              /* ─ Preview / Loading ─ */
              <div style={{ flex:1,overflow:"hidden",position:"relative",background:"#fff" }}>
                {!previewHTML ? (
                  <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <DotsGrid animated={generating} />
                  </div>
                ) : (
                  <iframe key={iframeKey} srcDoc={previewHTML}
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                    style={{ width:"100%",height:"100%",border:"none" }}
                    title="앱 미리보기" />
                )}
              </div>
            )}

            {/* Console panel (collapsible) */}
            {(showConsole || logs.length > 0) && (
              <div style={{ flexShrink:0,borderTop:"1px solid #e4e4e7",
                background:"#0f0f17",display:"flex",flexDirection:"column",
                height: showConsole ? 160 : 30 }}>
                <div onClick={()=>setShowConsole(o=>!o)}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"5px 12px",cursor:"pointer",flexShrink:0 }}>
                  <span style={{ fontSize:11,fontWeight:600,color:"#94a3b8",display:"flex",alignItems:"center",gap:6 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="1" width="9" height="9" rx="1.5"/><path d="M3 4l1.5 1.5L3 7M6 7h2"/>
                    </svg>
                    콘솔
                    {errorCount > 0 && (
                      <span style={{ background:"#f87171",color:"#fff",fontSize:10,fontWeight:700,
                        padding:"1px 6px",borderRadius:10 }}>{errorCount}</span>
                    )}
                  </span>
                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={e=>{e.stopPropagation();setLogs([]);}}
                      style={{ background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>지우기</button>
                    <span style={{ color:"#64748b",fontSize:13 }}>{showConsole?"▾":"▴"}</span>
                  </div>
                </div>
                {showConsole && (
                  <div style={{ flex:1,overflow:"auto",padding:"0 12px 8px",
                    fontFamily:'"JetBrains Mono","Fira Code",monospace',fontSize:11,lineHeight:1.7 }}>
                    {logs.length === 0 ? (
                      <div style={{ color:"#475569" }}>콘솔 출력이 여기에 표시됩니다.</div>
                    ) : (
                      logs.map((l,i)=>(
                        <div key={i} style={{ display:"flex",gap:8,
                          borderLeft:`2px solid ${l.level==="error"?"#f87171":l.level==="warn"?"#fb923c":"transparent"}`,
                          paddingLeft:6,marginBottom:1 }}>
                          <span style={{ color:"#475569",flexShrink:0 }}>{l.ts}</span>
                          <span style={{ color:logColor(l.level) }}>{l.msg}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast} onHide={()=>setToast("")} />}

      <style>{`
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dotPulse   { 0%,100%{opacity:.35;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes dotBounce  { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes fadeUp     { from{opacity:0;transform:translate(-50%,8px)} to{opacity:1;transform:translate(-50%,0)} }
        *{ box-sizing:border-box; }
        textarea::placeholder{ color:#a1a1aa; }
        ::-webkit-scrollbar{ width:5px; height:5px; }
        ::-webkit-scrollbar-track{ background:transparent; }
        ::-webkit-scrollbar-thumb{ background:#e4e4e7; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover{ background:#d4d4d8; }
        button:hover:not(:disabled){ opacity:0.88; }
      `}</style>
    </div>
  );
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

export default function IDEWrapper() {
  return (
    <Suspense fallback={
      <div style={{ background:"#fff",height:"100vh",display:"flex",alignItems:"center",
        justifyContent:"center",fontFamily:"Inter,sans-serif" }}>
        <DotsGrid animated={true} />
        <style>{`@keyframes dotPulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    }>
      <AgentPage />
    </Suspense>
  );
}
