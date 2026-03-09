"use client";

import { useState } from "react";

interface Props {
  slug: string;
  initialBookmarked?: boolean;
  size?: number;
}

export default function BookmarkButton({ slug, initialBookmarked = false, size = 18 }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const method = bookmarked ? "DELETE" : "POST";
      const res = await fetch("/api/bookmarks", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) {
        window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
        return;
      }
      if (res.ok) setBookmarked(!bookmarked);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "북마크 해제" : "북마크"}
      aria-label={bookmarked ? "북마크 해제" : "북마크"}
      style={{
        background: bookmarked ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.05)",
        border: bookmarked ? "1px solid rgba(249,115,22,0.35)" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "5px 8px",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        lineHeight: 1,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={bookmarked ? "#f97316" : "none"}
        stroke={bookmarked ? "#f97316" : "#9ca3af"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
