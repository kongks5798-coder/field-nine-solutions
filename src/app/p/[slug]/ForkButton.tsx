"use client";

import { useState } from "react";

interface ForkButtonProps {
  slug: string;
}

export function ForkButton({ slug }: ForkButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleFork() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/published/${encodeURIComponent(slug)}/fork`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.status === 401) {
        // Redirect to workspace with fork param so workspace can prompt login
        window.location.href = `/workspace?fork=${encodeURIComponent(slug)}`;
        return;
      }
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert(data.error ?? "포크 실패");
      }
    } catch {
      alert("포크 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleFork}
      disabled={loading}
      title="이 앱을 내 워크스페이스로 포크"
      style={{
        padding: "4px 10px",
        borderRadius: 7,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "transparent",
        color: loading ? "#4b5563" : "#6b7280",
        fontSize: 12,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s",
      }}
    >
      {loading ? "⏳" : "🍴"} {loading ? "포크 중…" : "포크"}
    </button>
  );
}
