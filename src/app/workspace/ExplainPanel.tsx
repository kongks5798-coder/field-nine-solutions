"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  html: string;
  css: string;
  js: string;
  appName: string;
  onClose: () => void;
}

export function ExplainPanel({ html, css, js, appName, onClose }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function explain() {
    setLoading(true);
    setStarted(true);
    setContent("");
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, css, js, appName }),
        signal: abortRef.current.signal,
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const { text } = JSON.parse(payload);
              if (text) setContent(prev => prev + text);
            } catch { /* skip */ }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-start on mount
  useEffect(() => { explain(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Simple markdown-ish render: ## headers, bullet points
  function renderMd(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <div key={i} style={{ fontWeight: 800, color: "#f97316", fontSize: 13, marginTop: 14, marginBottom: 4 }}>{line.slice(3)}</div>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft: 12, color: "#cbd5e1", fontSize: 12, lineHeight: 1.7 }}>{line}</div>;
      if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
      return <div key={i} style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.7 }}>{line}</div>;
    });
  }

  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0, width: 320,
      background: "rgba(7,9,18,0.97)", backdropFilter: "blur(16px)",
      borderLeft: "1px solid rgba(249,115,22,0.2)",
      display: "flex", flexDirection: "column",
      zIndex: 60, boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      animation: "slideInRight 0.2s ease-out",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#f0f4f8" }}>AI 코드 설명</span>
          {loading && <span style={{ fontSize: 9, color: "#f97316", fontWeight: 700, background: "rgba(249,115,22,0.12)", padding: "1px 7px", borderRadius: 8, animation: "blink 1s ease-in-out infinite" }}>분석 중</span>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer", padding: "2px 4px" }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {!started ? (
          <div style={{ textAlign: "center", paddingTop: 40, color: "#475569", fontSize: 12 }}>분석 준비 중...</div>
        ) : (
          <div>
            {renderMd(content)}
            {loading && <span style={{ display: "inline-block", width: 6, height: 14, background: "#f97316", animation: "blink 0.8s step-end infinite", verticalAlign: "middle", marginLeft: 2 }} />}
          </div>
        )}
      </div>

      {/* Refresh */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={explain} disabled={loading} style={{
          width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(249,115,22,0.3)",
          background: loading ? "transparent" : "rgba(249,115,22,0.08)", color: loading ? "#475569" : "#f97316",
          fontSize: 12, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}>
          {loading ? "분석 중..." : "🔄 다시 설명해줘"}
        </button>
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
