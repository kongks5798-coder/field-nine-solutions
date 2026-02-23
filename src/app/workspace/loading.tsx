export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      background: "#07080f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: "linear-gradient(135deg, #f97316, #f43f5e)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: 22, color: "#fff",
        marginBottom: 20,
      }}>D</div>
      <div style={{
        width: 24, height: 24,
        border: "2.5px solid rgba(232,234,240,0.15)",
        borderTopColor: "#f97316",
        borderRadius: "50%",
        animation: "dalkak-spin 0.8s linear infinite",
        marginBottom: 16,
      }} />
      <div style={{ fontSize: 14, color: "#8b8fa3" }}>
        워크스페이스 로딩 중...
      </div>
      <style>{`@keyframes dalkak-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
