"use client";

import { useState } from "react";
import type { WorkspaceMemory } from "./ai/useWorkspaceMemory";
import { buildMemoryContext } from "./ai/useWorkspaceMemory";

interface MemoryPanelProps {
  memories: WorkspaceMemory[];
  onUseMemory: (ctx: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function MemoryPanel({ memories, onUseMemory, onDelete }: MemoryPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#1a1a1f",
        borderLeft: "1px solid #2a2a35",
        width: collapsed ? 36 : 240,
        minWidth: collapsed ? 36 : 240,
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: collapsed ? "10px 8px" : "10px 12px",
          borderBottom: "1px solid #2a2a35",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={() => setCollapsed(c => !c)}
        role="button"
        aria-expanded={!collapsed}
        aria-label="메모리 패널 열기/닫기"
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "#7c7c96",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            AI 기억
          </span>
        )}
        <span
          style={{
            fontSize: 14,
            color: "#5a5a72",
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {collapsed ? "»" : "«"}
        </span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          {memories.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "#4a4a5c",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              아직 저장된 기억이 없어요
              <br />
              <span style={{ fontSize: 10, color: "#3a3a4a" }}>
                앱을 생성하면 자동 저장됩니다
              </span>
            </div>
          ) : (
            memories.map(memory => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                isDeleting={deletingId === memory.id}
                onUse={() => onUseMemory(buildMemoryContext([memory]))}
                onDelete={() => handleDelete(memory.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Memory Card ───────────────────────────────────────────────────────────────

interface MemoryCardProps {
  memory: WorkspaceMemory;
  isDeleting: boolean;
  onUse: () => void;
  onDelete: () => void;
}

function MemoryCard({ memory, isDeleting, onUse, onDelete }: MemoryCardProps) {
  const [hovered, setHovered] = useState(false);

  const themeColor =
    memory.style_tokens.theme === "dark"
      ? "#4a9eff"
      : memory.style_tokens.theme === "light"
      ? "#ffb347"
      : "#5a5a72";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid #22222c",
        background: hovered ? "#22222e" : "transparent",
        transition: "background 0.15s",
        opacity: isDeleting ? 0.4 : 1,
        cursor: "default",
      }}
    >
      {/* Prompt preview */}
      <div
        style={{
          fontSize: 12,
          color: "#c0c0d8",
          lineHeight: 1.4,
          marginBottom: 4,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
        title={memory.prompt}
      >
        {memory.prompt}
      </div>

      {/* Date + theme dot */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: themeColor,
            flexShrink: 0,
          }}
          title={memory.style_tokens.theme ?? "unknown"}
        />
        <span style={{ fontSize: 10, color: "#4a4a5c" }}>
          {formatDate(memory.created_at)}
        </span>
      </div>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            marginBottom: 8,
          }}
        >
          {memory.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              style={{
                padding: "1px 6px",
                borderRadius: 3,
                background: "#2a2a38",
                color: "#7a7a96",
                fontSize: 10,
                whiteSpace: "nowrap",
              }}
            >
              {tag}
            </span>
          ))}
          {memory.tags.length > 4 && (
            <span style={{ fontSize: 10, color: "#4a4a5c" }}>
              +{memory.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onUse}
          disabled={isDeleting}
          style={{
            flex: 1,
            padding: "4px 0",
            background: "#2c3a55",
            border: "1px solid #3a4a70",
            borderRadius: 4,
            color: "#7ab8ff",
            fontSize: 10,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#344468")
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#2c3a55")
          }
        >
          이 스타일 참고
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            padding: "4px 8px",
            background: "transparent",
            border: "1px solid #3a2a2a",
            borderRadius: 4,
            color: "#7a4040",
            fontSize: 10,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "#3a2020";
            btn.style.color = "#ff7070";
          }}
          onMouseLeave={e => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "transparent";
            btn.style.color = "#7a4040";
          }}
          aria-label="이 기억 삭제"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
