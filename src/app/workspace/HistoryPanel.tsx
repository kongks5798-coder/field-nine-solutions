"use client";

import { useEffect, useState, useCallback } from "react";

interface HistoryItem {
  id: string;
  prompt: string;
  app_name?: string;
  model_id?: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
}

export default function HistoryPanel({ open, onClose, onSelect }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/history?limit=20");
      const d = await r.json() as { history?: HistoryItem[] };
      if (d.history) setItems(d.history);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1040,
          background: "rgba(0,0,0,0.4)",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: 360,
        zIndex: 1050,
        background: "#0d1117",
        borderLeft: "1px solid #21262d",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #21262d",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#d4d8e2" }}>생성 히스토리</div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#6b7280",
              cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#4a5066", fontSize: 13 }}>
              불러오는 중...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>아직 생성 기록이 없어요</div>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid #161b22",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#161b22")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  onClick={() => { onSelect(item.prompt); onClose(); }}
                  style={{ flex: 1 }}
                >
                  <div style={{
                    fontSize: 13, color: "#d4d8e2",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}>
                    {item.prompt}
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5066", display: "flex", gap: 8 }}>
                    {item.app_name && (
                      <span style={{ color: "#f97316" }}>{item.app_name}</span>
                    )}
                    <span>{new Date(item.created_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button
                    onClick={() => { onSelect(item.prompt); onClose(); }}
                    style={{
                      flex: 1, padding: "5px 0", borderRadius: 6,
                      border: "1px solid rgba(249,115,22,0.2)",
                      background: "rgba(249,115,22,0.08)", color: "#f97316",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    이 프롬프트 사용
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    style={{
                      padding: "5px 10px", borderRadius: 6,
                      border: "1px solid #21262d", background: "transparent",
                      color: "#6b7280", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
