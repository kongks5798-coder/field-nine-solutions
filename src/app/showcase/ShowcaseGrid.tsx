"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/constants";

type FilterTag = "전체" | "게임" | "앱" | "도구" | "웹사이트";

const TAG_COLORS: Record<FilterTag, string> = {
  전체: "#f97316",
  게임: "#f43f5e",
  앱: "#3b82f6",
  도구: "#8b5cf6",
  웹사이트: "#10b981",
};

interface AppCard {
  slug: string;
  name: string;
  views: number;
  relTime: string;
  tag: FilterTag;
  gradient: string;
}

function AppCardItem({ app }: { app: AppCard }) {
  const [hovered, setHovered] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const appUrl = `${SITE_URL}/p/${app.slug}`;

  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Thumbnail */}
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", textDecoration: "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            width: "100%",
            aspectRatio: "16/10",
            borderRadius: 10,
            overflow: "hidden",
            position: "relative",
            background: app.gradient,
          }}
        >
          {/* Gradient placeholder — always rendered */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: app.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.7)",
              fontWeight: 600,
              letterSpacing: 0.5,
              transition: "opacity 0.3s",
              opacity: hovered && iframeLoaded ? 0 : 1,
              zIndex: 2,
            }}
          >
            {hovered ? "로딩 중…" : "미리보기"}
          </div>

          {/* Iframe — loaded on hover, scaled to fit */}
          {hovered && (
            <iframe
              src={appUrl}
              title={app.name}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1200,
                height: 750,
                border: "none",
                transformOrigin: "0 0",
                transform: "scale(var(--thumb-scale, 0.275))",
                pointerEvents: "none",
                opacity: iframeLoaded ? 1 : 0,
                transition: "opacity 0.3s",
                zIndex: 1,
              }}
            />
          )}

          {/* Overlay: hover glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: hovered ? "rgba(0,0,0,0.08)" : "transparent",
              transition: "background 0.2s",
              zIndex: 3,
              borderRadius: 10,
            }}
          />
        </div>
      </a>

      {/* Tag */}
      <span
        style={{
          alignSelf: "flex-start",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          background: TAG_COLORS[app.tag] ?? "#6b7280",
          padding: "3px 10px",
          borderRadius: 20,
        }}
      >
        {app.tag}
      </span>

      {/* Name */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b1b1f", margin: 0, lineHeight: 1.3 }}>
        {app.name.length > 30 ? app.name.slice(0, 30) + "…" : app.name}
      </h3>

      {/* Meta */}
      <div style={{ fontSize: 12, color: "#9ca3af", display: "flex", gap: 10 }}>
        <span>👁 {app.views.toLocaleString()}</span>
        <span>· {app.relTime}</span>
      </div>

      {/* CTA */}
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "auto",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "9px 0",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          color: "#f97316",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          textDecoration: "none",
        }}
      >
        구경하기 →
      </a>
    </article>
  );
}

export function ShowcaseGrid({ apps }: { apps: AppCard[] }) {
  return (
    <>
      <style>{`
        .showcase-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .showcase-grid article { --thumb-scale: 0.275; }
        @media (max-width: 1024px) {
          .showcase-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .showcase-grid article { --thumb-scale: 0.22; }
        }
        @media (max-width: 600px) {
          .showcase-grid { grid-template-columns: 1fr !important; }
          .showcase-grid article { --thumb-scale: 0.28; }
        }
      `}</style>
      <div className="showcase-grid">
        {apps.map((app) => (
          <AppCardItem key={app.slug} app={app} />
        ))}
      </div>
    </>
  );
}
