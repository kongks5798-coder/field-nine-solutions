"use client";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  color = "#58a6ff",
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        padding: "20px 24px",
        flex: 1,
        minWidth: 150,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s",
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}60`;
        (e.currentTarget as HTMLDivElement).style.background = "#1c2333";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#30363d";
        (e.currentTarget as HTMLDivElement).style.background = "#161b22";
      } : undefined}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#8b949e", marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#6e7681", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
