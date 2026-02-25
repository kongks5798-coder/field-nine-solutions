"use client";

import { T } from "./workspace.constants";

interface WorkspaceToastProps {
  message: string | null;
}

export function WorkspaceToast({ message }: WorkspaceToastProps) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: "rgba(255,255,255,0.97)", color: T.text,
      padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 500,
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      border: `1px solid ${T.border}`, zIndex: 9999, whiteSpace: "nowrap",
      backdropFilter: "blur(16px)", animation: "fadeUp 0.18s ease",
    }}>{message}</div>
  );
}
