"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { T as _T } from "@/lib/theme";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ToastContainer";

const T = { ..._T, purple: "#a855f7" };

const STYLES = ["vivid", "natural"] as const;
const SIZES  = ["1024x1024", "1792x1024", "1024x1792"] as const;
const QUALITY = ["standard", "hd"] as const;

type GeneratedImage = { url?: string; b64_json?: string; revised_prompt?: string };

// ─── Persistent history ──────────────────────────────────────────────────────

type CanvasHistoryItem = { prompt: string; url: string; createdAt: string };
const CANVAS_HISTORY_KEY = "f9_canvas_history";
const MAX_CANVAS_HISTORY = 20;

function loadCanvasHistory(): CanvasHistoryItem[] {
  try {
    const raw = localStorage.getItem(CANVAS_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CanvasHistoryItem =>
        typeof item === "object" && item !== null &&
        typeof (item as CanvasHistoryItem).prompt === "string" &&
        typeof (item as CanvasHistoryItem).url === "string" &&
        typeof (item as CanvasHistoryItem).createdAt === "string",
    );
  } catch {
    return [];
  }
}

function saveCanvasHistory(items: CanvasHistoryItem[]): void {
  try {
    localStorage.setItem(CANVAS_HISTORY_KEY, JSON.stringify(items.slice(0, MAX_CANVAS_HISTORY)));
  } catch { /* quota exceeded — silently ignore */ }
}

function PromptTag({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={`스타일 태그: ${label}`} style={{
      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)",
      color: T.muted, cursor: "pointer", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.accent; }}
      onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border; }}
    >
      {label}
    </button>
  );
}

const PROMPT_TAGS = [
  "cinematic lighting", "ultra detailed", "8K resolution", "watercolor",
  "oil painting", "cyberpunk", "anime style", "photorealistic",
  "minimalist", "dark fantasy", "futuristic city", "bokeh",
];

export default function DalkkakCanvasPage() {
  const [prompt,   setPrompt]   = useState("");
  const [style,    setStyle]    = useState<typeof STYLES[number]>("vivid");
  const [size,     setSize]     = useState<typeof SIZES[number]>("1024x1024");
  const [quality,  setQuality]  = useState<typeof QUALITY[number]>("standard");
  const [n,        setN]        = useState(1);
  const [images,   setImages]   = useState<GeneratedImage[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState<GeneratedImage | null>(null);
  const [history,  setHistory]  = useState<GeneratedImage[]>([]);
  const [persistedHistory, setPersistedHistory] = useState<CanvasHistoryItem[]>([]);
  const { toasts, showToast } = useToast(4000);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted history from localStorage on mount
  useEffect(() => {
    setPersistedHistory(loadCanvasHistory());
  }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/canvas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size, quality, n }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (r.status === 429) {
          showToast("API 호출 한도 초과 — 잠시 후 다시 시도해주세요", "error");
        } else if (r.status === 401) {
          showToast("API 키를 확인해주세요 (설정 → API Keys)", "error");
        } else {
          showToast(`이미지 생성 실패: ${d.error ?? r.statusText}`, "error");
        }
        setError(d.error ?? "생성 실패");
        return;
      }
      const imgs: GeneratedImage[] = d.images ?? [];
      setImages(imgs);
      setHistory(h => [...imgs, ...h].slice(0, 50));
      if (imgs[0]) setSelected(imgs[0]);

      // Persist to localStorage
      const now = new Date().toISOString();
      const newItems: CanvasHistoryItem[] = imgs
        .filter((img): img is GeneratedImage & { url: string } => !!img.url)
        .map(img => ({ prompt, url: img.url, createdAt: now }));
      if (newItems.length > 0) {
        setPersistedHistory(prev => {
          const updated = [...newItems, ...prev].slice(0, MAX_CANVAS_HISTORY);
          saveCanvasHistory(updated);
          return updated;
        });
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      showToast(`이미지 생성 실패: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearPersistedHistory = useCallback(() => {
    setPersistedHistory([]);
    saveCanvasHistory([]);
  }, []);

  const appendTag = (tag: string) => {
    setPrompt(p => p ? `${p}, ${tag}` : tag);
    textRef.current?.focus();
  };

  const downloadImage = (img: GeneratedImage) => {
    try {
      const url = img.url ?? (img.b64_json ? `data:image/png;base64,${img.b64_json}` : "");
      if (!url) { showToast("다운로드 실패", "error"); return; }
      const a = document.createElement("a");
      a.href = url;
      a.download = `dalkak-canvas-${Date.now()}.png`;
      a.click();
    } catch {
      showToast("다운로드 실패", "error");
    }
  };

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", background: T.bg, color: T.text, fontFamily: '"Pretendard", Inter, sans-serif', overflow: "hidden" }}>

        {/* ── Left: Controls ── */}
        <div style={{ width: 320, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>Dalkak Canvas</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>AI 이미지 생성 스튜디오</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Prompt */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>프롬프트</label>
              <textarea
                ref={textRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generate(); }}
                placeholder="원하는 이미지를 설명하세요... (Ctrl+Enter로 생성)"
                rows={5}
                style={{
                  width: "100%", marginTop: 6, padding: "10px 12px",
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                  color: T.text, fontSize: 13, resize: "vertical", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5,
                }}
              />
            </div>

            {/* Prompt Tags */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>스타일 태그</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PROMPT_TAGS.map(t => <PromptTag key={t} label={t} onClick={() => appendTag(t)} />)}
              </div>
            </div>

            {/* Style */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>스타일</div>
              <div style={{ display: "flex", gap: 8 }}>
                {STYLES.map(s => (
                  <button key={s} onClick={() => setStyle(s)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${style === s ? T.accent : T.border}`,
                    background: style === s ? "rgba(249,115,22,0.1)" : "transparent",
                    color: style === s ? T.accent : T.muted,
                  }}>{s === "vivid" ? "선명" : "자연"}</button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>크기</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SIZES.map(sz => (
                  <button key={sz} onClick={() => setSize(sz)} style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", textAlign: "left",
                    border: `1px solid ${size === sz ? T.accent : T.border}`,
                    background: size === sz ? "rgba(249,115,22,0.08)" : "transparent",
                    color: size === sz ? T.accent : T.muted,
                  }}>
                    {sz === "1024x1024" ? "1:1 정사각형" : sz === "1792x1024" ? "16:9 가로" : "9:16 세로"} <span style={{ opacity: 0.5 }}>({sz})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>품질</div>
              <div style={{ display: "flex", gap: 8 }}>
                {QUALITY.map(q => (
                  <button key={q} onClick={() => setQuality(q)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${quality === q ? T.purple : T.border}`,
                    background: quality === q ? "rgba(168,85,247,0.1)" : "transparent",
                    color: quality === q ? T.purple : T.muted,
                  }}>{q === "standard" ? "표준" : "HD"}</button>
                ))}
              </div>
            </div>

            {/* N */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>생성 수: {n}장</div>
              <input type="range" min={1} max={4} value={n} onChange={e => setN(Number(e.target.value))}
                style={{ width: "100%", accentColor: T.accent }} />
            </div>

            {error && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", fontSize: 12, color: "#f87171" }}>
                {error}
              </div>
            )}
          </div>

          {/* Generate button */}
          <div style={{ padding: 16, borderTop: `1px solid ${T.border}` }}>
            <button onClick={generate} disabled={loading || !prompt.trim()} style={{
              width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
              background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #f43f5e)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer",
              transition: "opacity 0.2s",
            }}>
              {loading ? "생성 중..." : "✨ 이미지 생성"}
            </button>
          </div>
        </div>

        {/* ── Center: Canvas ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Main view */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: T.bg }}>
            {loading ? (
              <div style={{ textAlign: "center", color: T.muted }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 2s linear infinite" }}>✨</div>
                <div style={{ fontSize: 14 }}>AI가 이미지를 생성하고 있습니다...</div>
                <div style={{ fontSize: 12, marginTop: 8, color: "#4b5563" }}>보통 10~30초 소요됩니다</div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : selected ? (
              <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%" }}>
                <img
                  src={selected.url ?? `data:image/png;base64,${selected.b64_json}`}
                  alt={selected.revised_prompt || prompt || "AI 생성 이미지"}
                  loading="lazy"
                  style={{ maxWidth: "100%", maxHeight: "calc(100vh - 200px)", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
                />
                <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", gap: 8 }}>
                  <button onClick={() => downloadImage(selected)} style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(0,0,0,0.7)",
                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)",
                  }}>
                    ⬇ 다운로드
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(selected.url ?? ""); }} style={{
                    padding: "8px 16px", borderRadius: 8, border: "none", background: "rgba(0,0,0,0.7)",
                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)",
                  }}>
                    🔗 URL 복사
                  </button>
                </div>
                {selected.revised_prompt && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 11, color: T.muted, maxWidth: 600 }}>
                    <span style={{ fontWeight: 700, color: T.accent }}>AI 수정 프롬프트:</span> {selected.revised_prompt}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: T.muted }}>
                <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🎨</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: T.text }}>Canvas</div>
                <div style={{ fontSize: 13 }}>왼쪽에 프롬프트를 입력하고 이미지를 생성하세요</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Ctrl+Enter 또는 생성 버튼을 누르세요</div>
              </div>
            )}
          </div>

          {/* Bottom: generated grid */}
          {images.length > 1 && (
            <div style={{ height: 120, borderTop: `1px solid ${T.border}`, background: T.surface, display: "flex", gap: 10, padding: 12, overflowX: "auto" }}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url ?? `data:image/png;base64,${img.b64_json}`}
                  alt={img.revised_prompt || prompt || `생성된 이미지 ${i + 1}`}
                  loading="lazy"
                  onClick={() => setSelected(img)}
                  style={{
                    height: 96, width: 96, objectFit: "cover", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                    border: `2px solid ${selected === img ? T.accent : "transparent"}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: History ── */}
        {(history.length > 0 || persistedHistory.length > 0) && (
          <div style={{ width: 200, background: T.surface, borderLeft: `1px solid ${T.border}`, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                생성 기록
              </span>
              {persistedHistory.length > 0 && (
                <button
                  onClick={clearPersistedHistory}
                  style={{
                    fontSize: 10, fontWeight: 600, color: T.red, background: "none",
                    border: "none", cursor: "pointer", padding: "2px 4px",
                  }}
                >
                  이력 지우기
                </button>
              )}
            </div>

            {/* Session history (in-memory images) */}
            {history.length > 0 && (
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((img, i) => (
                  <img
                    key={`session-${i}`}
                    src={img.url ?? `data:image/png;base64,${img.b64_json}`}
                    alt={img.revised_prompt || `생성 기록 이미지 ${i + 1}`}
                    loading="lazy"
                    onClick={() => setSelected(img)}
                    style={{
                      width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer",
                      border: `2px solid ${selected === img ? T.accent : "transparent"}`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Persisted history (from localStorage, visible after refresh) */}
            {persistedHistory.length > 0 && history.length === 0 && (
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {persistedHistory.map((item, i) => (
                  <div key={`persisted-${i}`} style={{ position: "relative" }}>
                    <img
                      src={item.url}
                      alt={item.prompt}
                      loading="lazy"
                      onClick={() => setSelected({ url: item.url })}
                      style={{
                        width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, cursor: "pointer",
                        border: "2px solid transparent",
                      }}
                    />
                    <div style={{
                      fontSize: 10, color: T.muted, marginTop: 4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.prompt}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} />
    </AppShell>
  );
}
