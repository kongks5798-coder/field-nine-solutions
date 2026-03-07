"use client";

import { useState, useEffect } from "react";

const LIKES_KEY = "dalkak_likes";

function getLikedSlugs(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function LikeButton({ slug }: { slug: string }) {
  const [liked, setLiked] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setLiked(getLikedSlugs().has(slug));
  }, [slug]);

  function handleLike() {
    const set = getLikedSlugs();
    const nowLiked = !set.has(slug);
    if (nowLiked) set.add(slug); else set.delete(slug);
    try { localStorage.setItem(LIKES_KEY, JSON.stringify([...set])); } catch {}
    setLiked(nowLiked);
    if (nowLiked) { setPulse(true); setTimeout(() => setPulse(false), 400); }
    fetch(`/api/published/${encodeURIComponent(slug)}/like`, { method: "POST" }).catch(() => {});
  }

  return (
    <button
      onClick={handleLike}
      title={liked ? "좋아요 취소" : "좋아요"}
      style={{
        padding: "4px 10px",
        borderRadius: 7,
        border: liked ? "1px solid rgba(244,63,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
        background: liked ? "rgba(244,63,94,0.15)" : "transparent",
        color: liked ? "#f43f5e" : "#6b7280",
        fontSize: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s",
        transform: pulse ? "scale(1.25)" : "scale(1)",
      }}
    >
      {liked ? "♥" : "♡"}
    </button>
  );
}
