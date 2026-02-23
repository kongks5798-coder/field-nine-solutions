"use client";
import dynamic from "next/dynamic";

const Content = dynamic(() => import("./PricingContent"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#07080f", color: "#9ca3af", fontSize: 14 }}>
      로딩 중...
    </div>
  ),
});

export default function PricingPage() {
  return <Content />;
}
