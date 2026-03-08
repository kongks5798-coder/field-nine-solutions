"use client";
import { useState } from "react";

interface EmbedCodeProps {
  slug: string;
  appName: string;
}

const SIZES = {
  small:  { width: 400, height: 300,  label: "소 (400×300)" },
  medium: { width: 640, height: 480,  label: "중 (640×480)" },
  large:  { width: 900, height: 600,  label: "대 (900×600)" },
} as const;

type SizeKey = keyof typeof SIZES;

export function EmbedCode({ slug, appName }: EmbedCodeProps) {
  const [size, setSize] = useState<SizeKey>("medium");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://fieldnine.io";
  const { width, height } = SIZES[size];
  const embedUrl = `${origin}/embed/${slug}`;
  const appUrl   = `${origin}/p/${slug}`;

  const iframeCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allow="scripts" style="border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);" title="${appName}"></iframe>`;

  function copyEmbed() {
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(appUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${appName} — Dalkak AI로 만든 앱`)}&url=${encodeURIComponent(appUrl)}`;

  return (
    <div style={{ marginTop: 24 }}>
      {/* Share row */}
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 15 }}>🔗</span>
          <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: 13 }}>공유하기</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button
            onClick={copyLink}
            style={{
              flex: 1, minWidth: 120,
              padding: "8px 14px", borderRadius: 8, border: "1px solid #30363d",
              background: linkCopied ? "#238636" : "#21262d",
              color: "#c9d1d9", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
            }}
          >
            {linkCopied ? "✅ 복사됨!" : "📋 링크 복사"}
          </button>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, minWidth: 120,
              padding: "8px 14px", borderRadius: 8, border: "1px solid #30363d",
              background: "#21262d", color: "#c9d1d9", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            𝕏 트위터 공유
          </a>
        </div>
      </div>

      {/* Embed code */}
      <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 15 }}>{"</>"}</span>
          <span style={{ color: "#c9d1d9", fontWeight: 700, fontSize: 13 }}>임베드 코드</span>
          <span style={{ color: "#8b949e", fontSize: 11 }}>블로그·포트폴리오에 삽입</span>
        </div>

        {/* Size selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" as const }}>
          {(Object.keys(SIZES) as SizeKey[]).map(s => (
            <button
              key={s}
              onClick={() => setSize(s)}
              style={{
                padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                border: "1px solid",
                background: size === s ? "#21262d" : "transparent",
                borderColor: size === s ? "#58a6ff" : "#30363d",
                color: size === s ? "#58a6ff" : "#8b949e",
                fontFamily: "inherit",
              }}
            >
              {SIZES[s].label}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div style={{ background: "#0d1117", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
          <code style={{ color: "#79c0ff", fontSize: 11, wordBreak: "break-all" as const, display: "block", lineHeight: 1.7, fontFamily: "monospace" }}>
            {iframeCode}
          </code>
        </div>

        <button
          onClick={copyEmbed}
          style={{
            width: "100%", background: copied ? "#238636" : "#21262d",
            color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 8,
            padding: "9px", fontSize: 13, cursor: "pointer", fontWeight: 600,
            fontFamily: "inherit", transition: "background 0.15s",
          }}
        >
          {copied ? "✅ 복사됨!" : "📋 임베드 코드 복사"}
        </button>

        <div style={{ marginTop: 10, fontSize: 11, color: "#6e7681" }}>
          직접 보기:{" "}
          <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#58a6ff" }}>
            {embedUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
