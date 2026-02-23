export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07080f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(249,115,22,0.2)",
          borderTop: "3px solid #f97316",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 16px",
        }} />
        <div style={{ color: "#9ca3af", fontSize: 14 }}>
          로딩 중...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
