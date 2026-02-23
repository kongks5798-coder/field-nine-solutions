"use client";

import dynamicImport from "next/dynamic";

const IDEContent = dynamicImport(() => import("./IDEContent"), {
  ssr: false,
  loading: () => (
    <div style={{ background: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 5 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: "#d4d4d8", opacity: 0.4 }} />
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#71717a" }}>IDE 로딩 중...</div>
        </div>
      </div>
    </div>
  ),
});

export default function IDEPage() {
  return <IDEContent />;
}
