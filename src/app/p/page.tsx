"use client";
import { useEffect, useState } from "react";

async function decompress(b64url: string): Promise<string> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const reader = ds.readable.getReader();
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value!);
  }
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  parts.forEach(p => { out.set(p, off); off += p.length; });
  return new TextDecoder().decode(out);
}

export default function SharedApp() {
  const [html, setHtml] = useState("");
  const [name, setName] = useState("내 앱");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) { setStatus("error"); return; }
    const sep = hash.indexOf(":");
    const rawName = sep > 0 ? hash.slice(0, sep) : "";
    const data = sep > 0 ? hash.slice(sep + 1) : hash;
    if (rawName) {
      try { setName(decodeURIComponent(rawName)); } catch { setName(rawName); }
    }
    decompress(data)
      .then(h => { setHtml(h); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") return (
    <div style={{ height: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, fontFamily: "sans-serif" }}>
      <div style={{ width: 22, height: 22, border: "2px solid rgba(249,115,22,0.25)", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#555", fontSize: 12 }}>앱 불러오는 중...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (status === "error") return (
    <div style={{ height: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 44 }}>🔍</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#d4d8e2" }}>앱을 찾을 수 없습니다</div>
      <div style={{ fontSize: 12, color: "#555" }}>링크가 올바르지 않거나 손상되었습니다.</div>
      <a href="/workspace" style={{ marginTop: 8, padding: "10px 22px", borderRadius: 8, background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
        새 앱 만들기 →
      </a>
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      {/* Brand bar */}
      <div style={{ height: 36, background: "#06060d", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex" }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#fff" }}>F9</div>
        </a>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#d4d8e2" }}>{name}</span>
        <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 9999, background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>배포됨</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#444" }}>Powered by</span>
          <a href="https://fieldnine.io" style={{ fontSize: 10, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>FieldNine</a>
          <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)" }} />
          <a href="/workspace" style={{ fontSize: 10, color: "#d4d8e2", textDecoration: "none", padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.1)" }}>✎ 수정하기</a>
        </div>
      </div>
      {/* App preview */}
      <iframe
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        title={name}
        style={{ flex: 1, border: "none", width: "100%" }}
      />
    </div>
  );
}
