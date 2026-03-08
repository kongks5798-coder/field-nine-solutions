"use client";

import { useState } from "react";
import { T, tokToUSD } from "./workspace.constants";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  publishedUrl: string;
  tokenBalance: number;
  showToast: (msg: string) => void;
}

const EMBED_SIZES = {
  small:  { width: 400, height: 300, label: "소" },
  medium: { width: 640, height: 480, label: "중" },
  large:  { width: 900, height: 600, label: "대" },
} as const;
type EmbedSize = keyof typeof EMBED_SIZES;

export function PublishModal({ open, onClose, publishedUrl, tokenBalance, showToast }: PublishModalProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedSize, setEmbedSize] = useState<EmbedSize>("medium");
  const [embedCopied, setEmbedCopied] = useState(false);

  if (!open) return null;
  const isAnon = publishedUrl.includes("?anon=1");
  const cleanUrl = publishedUrl.replace("?anon=1", "");
  const isDataUrl = publishedUrl.includes("/p#");

  // Extract slug from URL like /p/some-slug or https://fieldnine.io/p/some-slug
  const slugMatch = cleanUrl.match(/\/p\/([^/?#]+)/);
  const slug = slugMatch ? slugMatch[1] : null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://fieldnine.io";
  const embedUrl = slug ? `${origin}/embed/${slug}` : null;
  const { width, height } = EMBED_SIZES[embedSize];
  const iframeCode = embedUrl
    ? `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allow="scripts" style="border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);"></iframe>`
    : "";

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Dalkak AI로 만든 웹앱을 공유합니다!")}&url=${encodeURIComponent(cleanUrl)}`;

  function copyEmbed() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      showToast("</> 임베드 코드 복사됨");
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-title"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 28px 70px rgba(0,0,0,0.75)" }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">🚀</div>
        <div id="publish-title" style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>배포 완료!</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: isAnon ? 10 : 20, lineHeight: 1.7 }}>
          앱이 배포되었습니다. 아래 링크를 공유하면 누구든지 접근할 수 있습니다.
        </div>

        {/* Anonymous deploy notice */}
        {isAnon && (
          <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#f97316", lineHeight: 1.6 }}>
            <strong>비로그인 배포</strong> — URL이 7일 후 만료됩니다.<br />
            <a href="/login" style={{ color: "#f97316", fontWeight: 700 }}>로그인</a>하면 영구 URL + 커스텀 이름을 받을 수 있어요.
          </div>
        )}

        <div
          aria-label="배포된 앱 URL"
          style={{ background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 10, color: "#7a8098", wordBreak: "break-all", fontFamily: "monospace", maxHeight: 76, overflowY: "auto", lineHeight: 1.6 }}
        >
          {isDataUrl ? "(오프라인 모드 — 긴 데이터 URL)" : cleanUrl}
        </div>

        <div style={{ fontSize: 10, color: T.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: T.green }} aria-hidden="true">✓</span>
          토큰 잔액: <strong style={{ color: T.text }}>{tokToUSD(tokenBalance)}</strong>
          <span style={{ color: T.border }}>·</span>
          AI 사용 시 $0.05 ~ $5.95 차감됩니다
        </div>

        {/* Main actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => { navigator.clipboard.writeText(cleanUrl).catch(() => {}); showToast("🔗 URL 복사됨"); }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            🔗 링크 복사
          </button>
          <button
            onClick={() => window.open(cleanUrl, "_blank")}
            aria-label="새 탭에서 열기"
            style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.text, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            ↗ 새 탭
          </button>
          <button
            onClick={onClose}
            style={{ padding: "11px 16px", borderRadius: 10, border: `1px solid ${T.border}`, background: "#f3f4f6", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            닫기
          </button>
        </div>

        {/* Share row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {/* KakaoTalk share — native Web Share API (shows KakaoTalk on mobile) */}
          <button
            onClick={() => {
              const shareText = "딸깍 AI로 만든 웹앱을 확인해보세요! 🚀";
              if (navigator.share) {
                navigator.share({ title: "내 앱 공유", text: shareText, url: cleanUrl }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareText + "\n" + cleanUrl).catch(() => {});
                showToast("📋 카카오톡에 붙여넣기하세요!");
              }
            }}
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "1px solid rgba(254,229,0,0.3)",
              background: "#FEE500", color: "#3a1d1d", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            💬 카카오톡 공유
          </button>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "9px", borderRadius: 10, border: `1px solid ${T.border}`,
              background: "#f3f4f6", color: T.text, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            𝕏 트위터
          </a>
          {slug && !isDataUrl && (
            <button
              onClick={() => setShowEmbed(v => !v)}
              style={{
                flex: 1, padding: "9px", borderRadius: 10,
                border: `1px solid ${showEmbed ? T.accent : T.border}`,
                background: showEmbed ? `rgba(99,102,241,0.08)` : "#f3f4f6",
                color: showEmbed ? T.accent : T.text,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {"</>"} 임베드
            </button>
          )}
        </div>

        {/* Embed panel */}
        {showEmbed && slug && embedUrl && !isDataUrl && (
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 10 }}>크기 선택:</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {(Object.keys(EMBED_SIZES) as EmbedSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setEmbedSize(s)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                    border: "1px solid",
                    background: embedSize === s ? "#21262d" : "transparent",
                    borderColor: embedSize === s ? "#58a6ff" : "#30363d",
                    color: embedSize === s ? "#58a6ff" : "#8b949e",
                    fontFamily: "inherit",
                  }}
                >
                  {EMBED_SIZES[s].label} ({EMBED_SIZES[s].width}×{EMBED_SIZES[s].height})
                </button>
              ))}
            </div>
            <div style={{ background: "#0d1117", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <code style={{ color: "#79c0ff", fontSize: 10, wordBreak: "break-all", display: "block", lineHeight: 1.7, fontFamily: "monospace" }}>
                {iframeCode}
              </code>
            </div>
            <button
              onClick={copyEmbed}
              style={{
                width: "100%", background: embedCopied ? "#238636" : "#21262d",
                color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 8,
                padding: "9px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              {embedCopied ? "✅ 복사됨!" : "📋 임베드 코드 복사"}
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: "#6e7681" }}>
              직접 보기:{" "}
              <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff" }}>
                {embedUrl}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
