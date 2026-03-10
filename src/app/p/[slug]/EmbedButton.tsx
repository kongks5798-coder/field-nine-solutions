"use client";
import { useState } from "react";

interface EmbedButtonProps {
  slug: string;
  appName: string;
}

const SIZES = {
  small:  { w: 400,  h: 300, label: "소 (400×300)" },
  medium: { w: 640,  h: 480, label: "중 (640×480)" },
  large:  { w: 900,  h: 600, label: "대 (900×600)" },
} as const;
type SizeKey = keyof typeof SIZES;

export function EmbedButton({ slug, appName }: EmbedButtonProps) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<SizeKey>("medium");
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://fieldnine.io";
  const embedUrl = `${origin}/embed/${slug}`;
  const { w, h } = SIZES[size];
  const iframeCode = `<iframe src="${embedUrl}" width="${w}" height="${h}" frameborder="0" allow="scripts" style="border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);" title="${appName}"></iframe>`;

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      {/* Trigger button — styled to match .share-btn .share-copy */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.07)",
          color: "#9ca3af",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
        }}
      >
        {"</>"}  임베드
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Modal panel */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1117",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "linear-gradient(135deg,#f97316,#f43f5e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#fff", fontWeight: 800,
                }}>{"</>"}</span>
                <div>
                  <div style={{ color: "#f0f4f8", fontWeight: 700, fontSize: 15 }}>임베드 코드</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>블로그·포트폴리오에 이 앱을 삽입하세요</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent", border: "none", color: "#475569",
                  fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4,
                  borderRadius: 6,
                }}
                aria-label="닫기"
              >×</button>
            </div>

            {/* Preview thumbnail */}
            <div style={{
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 20,
              aspectRatio: "16/9",
              background: "#050508",
              position: "relative",
            }}>
              <iframe
                src={embedUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                referrerPolicy="no-referrer"
                title={`${appName} preview`}
                loading="lazy"
              />
              {/* overlay label */}
              <div style={{
                position: "absolute", bottom: 8, right: 8,
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                borderRadius: 6, padding: "3px 8px",
                fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600,
              }}>미리보기</div>
            </div>

            {/* Size selector */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>크기 선택</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(Object.keys(SIZES) as SizeKey[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 7,
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 600,
                      border: "1px solid",
                      borderColor: size === s ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.08)",
                      background: size === s ? "rgba(249,115,22,0.12)" : "transparent",
                      color: size === s ? "#f97316" : "#64748b",
                      transition: "all 0.15s",
                    }}
                  >
                    {SIZES[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code block */}
            <div style={{
              background: "#050508",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              padding: "12px 14px",
              marginBottom: 12,
              fontFamily: "monospace",
              fontSize: 11,
              color: "#7dd3fc",
              wordBreak: "break-all",
              lineHeight: 1.7,
              userSelect: "all",
            }}>
              {iframeCode}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 9,
                border: "none",
                background: copied
                  ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : "linear-gradient(135deg,#f97316,#f43f5e)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
                letterSpacing: "0.02em",
              }}
            >
              {copied ? "✅ 복사됨!" : "📋 임베드 코드 복사"}
            </button>

            {/* Direct link */}
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#475569" }}>
              직접 링크:{" "}
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#f97316", textDecoration: "none" }}
              >
                {embedUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
