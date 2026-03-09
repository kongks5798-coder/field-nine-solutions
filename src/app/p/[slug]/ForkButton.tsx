"use client";

import { useState } from "react";

interface ForkButtonProps {
  slug: string;
  forkCount?: number;
  /** "topbar" = compact inline button; "panel" = larger info-panel button */
  variant?: "topbar" | "panel";
}

export function ForkButton({ slug, forkCount, variant = "topbar" }: ForkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleFork() {
    if (loading || done) return;
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
        setDone(true);
        // Brief success flash then redirect
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 600);
      } else {
        alert(data.error ?? "포크 실패");
      }
    } catch {
      alert("포크 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "panel") {
    return (
      <button
        onClick={handleFork}
        disabled={loading || done}
        title="이 앱을 내 워크스페이스로 복제해서 수정하기"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 10,
          border: "none",
          background: done
            ? "linear-gradient(135deg,#22c55e,#16a34a)"
            : loading
            ? "rgba(249,115,22,0.3)"
            : "linear-gradient(135deg,#f97316,#f43f5e)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: loading || done ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {done ? "✓" : loading ? "⏳" : "⑂"}
        {done ? "복제 완료! 이동 중…" : loading ? "복제 중…" : "이 앱 복제하기"}
        {!loading && !done && typeof forkCount === "number" && forkCount > 0 && (
          <span style={{
            padding: "1px 7px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.2)",
            fontSize: 11,
            fontWeight: 700,
          }}>
            {forkCount >= 1000 ? `${(forkCount / 1000).toFixed(1)}k` : forkCount}
          </span>
        )}
      </button>
    );
  }

  // topbar variant — compact
  return (
    <button
      onClick={handleFork}
      disabled={loading || done}
      title="이 앱을 내 워크스페이스로 복제"
      style={{
        padding: "5px 12px",
        borderRadius: 7,
        border: "none",
        background: done
          ? "linear-gradient(135deg,#22c55e,#16a34a)"
          : "linear-gradient(135deg,#f97316,#f43f5e)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        cursor: loading || done ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        transition: "all 0.2s",
        opacity: loading ? 0.7 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {done ? "✓" : loading ? "⏳" : "⑂"}
      {done ? "완료!" : loading ? "복제 중…" : "복제"}
      {!loading && !done && typeof forkCount === "number" && forkCount > 0 && (
        <span style={{
          padding: "0 5px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.25)",
          fontSize: 10,
        }}>
          {forkCount}
        </span>
      )}
    </button>
  );
}
