"use client";
export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const LMContent = dynamicImport(() => import("./LMContent"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0e0e10", color: "#a1a1aa", fontFamily: '"Pretendard", Inter, sans-serif' }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🤖</div>
        <div style={{ fontSize: 14 }}>LM 로딩 중...</div>
      </div>
    </div>
  ),
});

export default function DalkkakLMPage() {
  return <LMContent />;
}
