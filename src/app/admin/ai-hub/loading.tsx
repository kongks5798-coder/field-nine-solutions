"use client";

export default function AiHubLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        background: "#07080f",
        color: "#9ca3af",
        fontSize: 15,
        fontFamily: '"Pretendard", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      AI Data Hub 데이터를 불러오는 중...
    </div>
  );
}
