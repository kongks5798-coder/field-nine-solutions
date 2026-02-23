"use client";

import dynamic from "next/dynamic";

const DocsContent = dynamic(() => import("./DocsContent"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0e0e10", color: "#a1a1aa", fontFamily: '"Pretendard", Inter, sans-serif' }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📄</div>
        <div style={{ fontSize: 14 }}>API Docs 로딩 중...</div>
      </div>
    </div>
  ),
});

export default function DocsPage() {
  return <DocsContent />;
}
