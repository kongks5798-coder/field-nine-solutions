"use client";

import React from "react";
import {
  T, AI_HIST_KEY, calcCost, tokToUSD,
} from "./workspace.constants";
import type { AiMsg, FilesMap } from "./workspace.constants";

// ── Parse AI message into text/code segments ────────────────────────────────
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

function CodeBlock({ block, onApply }: { block: Extract<MsgBlock, { type: "code" }>; onApply: (code: string, filename: string) => void }) {
  const [copied, setCopied] = React.useState(false);
  const langColor: Record<string, string> = {
    html: "#e44d26", css: "#264de4", js: "#f0db4f", javascript: "#f0db4f",
    ts: "#3178c6", typescript: "#3178c6", py: "#3572a5", python: "#3572a5", json: "#adb5bd",
  };
  const ext = block.filename ? block.filename.split(".").pop() ?? block.lang : block.lang;
  const dotColor = langColor[ext] ?? T.muted;
  const handleCopy = () => {
    navigator.clipboard.writeText(block.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid rgba(255,255,255,0.08)`, background: "#0a0a15", marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <span style={{ fontSize: 7, color: dotColor, fontWeight: 900 }}>⬤</span>
        <span style={{ flex: 1, fontSize: 10, color: T.muted, fontFamily: "inherit" }}>{block.filename || block.lang}</span>
        <button onClick={handleCopy}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "1px 5px" }}>
          {copied ? "✓ 복사됨" : "복사"}
        </button>
        {block.filename && (
          <button onClick={() => onApply(block.content, block.filename)}
            style={{ background: `linear-gradient(135deg,${T.accent},${T.accentB})`, border: "none", borderRadius: 4, color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "2px 8px", fontWeight: 700 }}>
            Apply
          </button>
        )}
      </div>
      <pre style={{ margin: 0, padding: "10px 12px", fontSize: 11, lineHeight: 1.6, color: "#c9d1d9", fontFamily: '"JetBrains Mono","Fira Code",monospace', overflowX: "auto", maxHeight: 220, whiteSpace: "pre" }}>
        {block.content}
      </pre>
    </div>
  );
}

type ImageAtt = { base64: string; mime: string; preview: string } | null;

export interface AiChatPanelProps {
  aiMsgs: AiMsg[];
  aiLoading: boolean;
  aiInput: string;
  imageAtt: ImageAtt;
  streamingText: string;
  agentPhase: "planning" | "coding" | "reviewing" | null;
  setAiMsgs: React.Dispatch<React.SetStateAction<AiMsg[]>>;
  setAiInput: React.Dispatch<React.SetStateAction<string>>;
  setImageAtt: React.Dispatch<React.SetStateAction<ImageAtt>>;
  handleAiSend: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  handleImageFile: (f: File) => void;
  toggleVoice: () => void;
  runAI: (prompt: string) => void;
  showToast: (msg: string) => void;
  aiEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  abortRef: React.RefObject<AbortController | null>;
  filesRef: React.RefObject<FilesMap | null>;
  isRecording: boolean;
  router: { push: (url: string) => void };
  onApplyCode?: (code: string, filename: string) => void;
  isMobile?: boolean;
}

function AiChatPanelInner({
  aiMsgs, aiLoading, aiInput, imageAtt, streamingText, agentPhase,
  setAiMsgs, setAiInput, setImageAtt, handleAiSend, handleDrop, handlePaste,
  handleImageFile, toggleVoice, runAI, showToast, aiEndRef, fileInputRef, abortRef,
  filesRef, isRecording, router, onApplyCode, isMobile,
}: AiChatPanelProps) {
  // Mobile: 44px touch targets, 16px font (prevents iOS auto-zoom)
  const btnSize = isMobile ? 44 : 28;
  const btnGap = isMobile ? 8 : 4;
  const inputFontSize = isMobile ? 16 : 12;
  const inputPadRight = isMobile ? (btnSize * 3 + btnGap * 3 + 8) : 72;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {aiMsgs.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={() => { setAiMsgs([]); try { localStorage.removeItem(AI_HIST_KEY); } catch {} }}
            style={{ background: "none", border: "none", color: T.muted, fontSize: 10, cursor: "pointer", fontFamily: "inherit", padding: "2px 6px", borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = T.red)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            title="대화 기록 초기화">대화 초기화</button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px 4px", display: "flex", flexDirection: "column", gap: 12 }}>
        {aiMsgs.length === 0 && !aiLoading && (
          <div style={{ textAlign: "center", padding: "28px 12px", color: T.muted }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px",
              background: `linear-gradient(135deg,${T.accent}20,${T.accentB}15)`,
              border: `1px solid ${T.accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>✦</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Dalkak AI</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.7, marginBottom: 14 }}>
              앱을 만들거나 코드를 수정해드릴게요.<br/>이미지를 붙여넣거나 드래그하세요.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["💎 포트폴리오 페이지 만들어줘", "📊 차트 대시보드 만들어줘", "🎮 뱀 게임 만들어줘", "🌦 날씨 앱 UI 만들어줘"].map(s => (
                <button key={s} onClick={() => setAiInput(s.slice(2).trim())}
                  style={{
                    padding: "7px 10px", borderRadius: 8, fontSize: 11, textAlign: "left",
                    border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)",
                    color: T.muted, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                >{s}</button>
              ))}
              <button onClick={() => {
                  const files = filesRef.current ?? {};
                  const hasCode = Object.values(files).some(f => f.content.length > 100 && !f.content.includes("Dalkak IDE"));
                  if (!hasCode) { showToast("⚠️ 리뷰할 코드가 없습니다"); return; }
                  const code = Object.entries(files).map(([n, f]) => `[${n}]\n${f.content}`).join("\n\n---\n\n");
                  runAI(`다음 코드를 전문 개발자 관점에서 리뷰해줘. 버그, 성능 이슈, 보안 취약점, UX 개선점을 항목별로 한국어로 설명해줘:\n${code}`);
                }}
                style={{
                  padding: "7px 10px", borderRadius: 8, fontSize: 11, textAlign: "left",
                  border: `1px solid rgba(96,165,250,0.25)`, background: "rgba(96,165,250,0.06)",
                  color: "#60a5fa", cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#60a5fa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(96,165,250,0.25)"; }}
              >🔍 현재 코드 AI 리뷰</button>
            </div>
          </div>
        )}

        {aiMsgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "100%" }}>
            {m.image && (
              <img src={m.image} alt="사용자가 첨부한 이미지" loading="lazy"
                style={{ maxWidth: "90%", maxHeight: 100, borderRadius: 8, marginBottom: 4, objectFit: "cover", border: `1px solid ${T.border}` }} />
            )}

            {m.role === "user" ? (
              /* User bubble */
              <div style={{
                maxWidth: "88%", padding: "9px 12px",
                borderRadius: "14px 14px 3px 14px",
                background: `linear-gradient(135deg,${T.accent},${T.accentB})`,
                color: "#fff", fontSize: 11.5, lineHeight: 1.65,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {m.text}
              </div>
            ) : m.text.includes("[RETRY:") ? (
              /* Retry bubble */
              <div style={{
                maxWidth: "92%", padding: "9px 12px",
                borderRadius: "14px 14px 14px 3px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                color: T.text, fontSize: 11.5, lineHeight: 1.65,
              }}>
                <span>{m.text.replace(/\[RETRY:[^\]]*\]/g, "").trim()}</span>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => {
                    const match = m.text.match(/\[RETRY:([^\]]*)\]/);
                    if (match) runAI(match[1]);
                  }} style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: T.accent, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    🔄 재시도
                  </button>
                  <button onClick={() => router.push("/settings")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                    ⚙️ API 설정
                  </button>
                </div>
              </div>
            ) : (
              /* Agent bubble — parsed into text + code blocks */
              <div style={{ maxWidth: "96%", display: "flex", flexDirection: "column", gap: 4 }}>
                {parseBlocks(m.text).map((block, bi) =>
                  block.type === "text" ? (
                    block.content ? (
                      <div key={bi} style={{
                        padding: "9px 12px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
                        color: T.text, fontSize: 11.5, lineHeight: 1.65,
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

            <span style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{m.ts}</span>
          </div>
        ))}

        {aiLoading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            {!streamingText && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: "rgba(249,115,22,0.06)", border: `1px solid rgba(249,115,22,0.15)` }}>
                {(["planning", "coding", "reviewing"] as const).map((phase, i) => {
                  const labels = { planning: "🧠 계획", coding: "⚙️ 코딩", reviewing: "✅ 검토" };
                  const isActive = agentPhase === phase;
                  const isDone = (agentPhase === "coding" && i === 0) || (agentPhase === "reviewing" && i <= 1);
                  return (
                    <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: isActive ? 700 : 500,
                        color: isDone ? T.green : isActive ? T.accent : T.muted,
                        opacity: isActive ? 1 : isDone ? 0.9 : 0.5,
                      }}>{isDone ? "✓" : ""}{labels[phase]}</span>
                      {i < 2 && <span style={{ color: T.border, fontSize: 9 }}>›</span>}
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{
              maxWidth: "92%", padding: "9px 12px", borderRadius: "14px 14px 14px 3px",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
              color: T.text, fontSize: 11.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
            }}>
              {streamingText || (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: T.muted }}>
                    {agentPhase === "planning" ? "계획 수립 중..." : agentPhase === "reviewing" ? "코드 검토 중..." : "생성 중"}
                  </span>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: T.accent, animation: `dotBounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={aiEndRef as React.RefObject<HTMLDivElement>} />
      </div>

      {/* Image preview strip */}
      {imageAtt && (
        <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <img src={imageAtt.preview} alt="첨부된 이미지 미리보기" loading="lazy"
            style={{ height: 44, width: 44, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.border}` }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: T.accent, fontWeight: 600 }}>이미지 첨부됨</div>
            <div style={{ fontSize: 9, color: T.muted }}>전송 시 AI Vision으로 분석</div>
          </div>
          <button onClick={() => setImageAtt(null)}
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
        </div>
      )}

      {/* AI Input */}
      <div style={{ padding: "8px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ position: "relative" }} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
          <textarea
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
            onPaste={handlePaste}
            placeholder={isMobile ? "무엇을 만들까요?" : "앱이나 기능을 설명하세요... (이미지 붙여넣기 가능)"}
            disabled={aiLoading}
            rows={isMobile ? 2 : 3}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: `1px solid ${T.border}`, color: T.text, borderRadius: isMobile ? 14 : 10,
              padding: `${isMobile ? 12 : 9}px ${inputPadRight}px ${isMobile ? 12 : 9}px ${isMobile ? 16 : 12}px`,
              fontSize: inputFontSize, fontFamily: "inherit",
              resize: "none", outline: "none", lineHeight: 1.55, transition: "border 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = T.borderHi)}
            onBlur={e => (e.target.style.borderColor = T.border)}
          />
          {/* Image attach */}
          <input ref={fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
          <button onClick={() => (fileInputRef as React.RefObject<HTMLInputElement>).current?.click()} title="이미지 첨부"
            style={{
              position: "absolute", right: btnSize * 2 + btnGap * 2 + 8, bottom: isMobile ? 10 : 8,
              width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7,
              border: `1px solid ${imageAtt ? T.accent : T.border}`,
              background: imageAtt ? `${T.accent}20` : "rgba(255,255,255,0.06)",
              color: imageAtt ? T.accent : T.muted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <svg width={isMobile ? 18 : 12} height={isMobile ? 18 : 12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="2" width="10" height="8" rx="1.5"/><circle cx="4" cy="5" r="1"/><path d="M1 9l3-3 2 2 2-3 3 4"/>
            </svg>
          </button>
          {/* Voice */}
          <button onClick={toggleVoice} title={isRecording ? "음성 입력 중지" : "음성으로 입력"}
            style={{
              position: "absolute", right: btnSize + btnGap + 8, bottom: isMobile ? 10 : 8,
              width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7,
              border: `1px solid ${isRecording ? "#ef4444" : T.border}`,
              background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
              color: isRecording ? "#ef4444" : T.muted, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: isRecording ? "pulse 1s ease-in-out infinite" : "none",
            }}>
            <svg width={isMobile ? 18 : 12} height={isMobile ? 18 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="9" y1="22" x2="15" y2="22"/>
            </svg>
          </button>
          {/* Send */}
          <button onClick={handleAiSend} disabled={!aiInput.trim() || aiLoading}
            style={{
              position: "absolute", right: 8, bottom: isMobile ? 10 : 8,
              width: btnSize, height: btnSize, borderRadius: isMobile ? 10 : 7, border: "none",
              background: aiInput.trim() && !aiLoading ? `linear-gradient(135deg,${T.accent},${T.accentB})` : "rgba(255,255,255,0.08)",
              color: "#fff", cursor: aiInput.trim() && !aiLoading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s",
            }}>
            {aiLoading
              ? <div style={{ width: isMobile ? 14 : 10, height: isMobile ? 14 : 10, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
              : <svg width={isMobile ? 16 : 10} height={isMobile ? 16 : 10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9V1M1 5l4-4 4 4"/></svg>
            }
          </button>
        </div>
        <div style={{ fontSize: 9.5, color: T.muted, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Enter 전송 · 이미지 드래그/Ctrl+V · 🎤 음성입력</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {aiInput.trim() && !aiLoading && (
              <span style={{ color: T.accent, fontWeight: 600 }}>
                ⚡ 예상 {tokToUSD(calcCost(aiInput))} 차감
              </span>
            )}
            {aiLoading && (
              <button onClick={() => abortRef.current?.abort()}
                style={{ background: "none", border: "none", color: T.red, fontSize: 9.5, cursor: "pointer", fontFamily: "inherit" }}>✕ 중단</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const AiChatPanel = React.memo(AiChatPanelInner);
