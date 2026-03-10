"use client";

import { usePresence, type PresenceUser } from "@/hooks/usePresence";
import { useState } from "react";

interface Props {
  slug: string;
  currentUser?: { id: string; name: string };
}

export function ViewersIndicator({ slug, currentUser }: Props) {
  const others = usePresence(`app-viewers:${slug}`, currentUser);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (others.length === 0) return null;

  const visible = others.slice(0, 5);
  const extra = others.length - visible.length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        width: "fit-content",
      }}
    >
      {/* Stacked avatars */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {visible.map((user: PresenceUser, i: number) => (
          <div
            key={user.userId}
            style={{ position: "relative", marginLeft: i === 0 ? 0 : -8 }}
            onMouseEnter={() => setHoveredId(user.userId)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: user.color,
                border: "2px solid #050508",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                cursor: "default",
                userSelect: "none",
                zIndex: visible.length - i,
                position: "relative",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            {/* Tooltip */}
            {hoveredId === user.userId && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 11,
                  color: "#f0f4f8",
                  whiteSpace: "nowrap",
                  zIndex: 999,
                  pointerEvents: "none",
                }}
              >
                {user.name}님이 보고 있어요
              </div>
            )}
          </div>
        ))}
        {extra > 0 && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "2px solid #050508",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              marginLeft: -8,
              position: "relative",
            }}
          >
            +{extra}
          </div>
        )}
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 12,
          color: "#94a3b8",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {others.length}명이 보고 있어요
      </span>
    </div>
  );
}
