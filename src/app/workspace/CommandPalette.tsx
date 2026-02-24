"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { T, AI_MODELS } from "./workspace.constants";
import type { FilesMap, LeftTab, LogEntry } from "./workspace.constants";

type CommandCategory = "file" | "run" | "ai" | "tool" | "nav";

type CommandItem = {
  category: CommandCategory;
  icon: React.ReactNode;
  label: string;
  description: string;
  shortcut?: string;
  action: () => void;
};

const CATEGORY_META: Record<CommandCategory, { emoji: string; label: string }> = {
  file: { emoji: "\uD83D\uDCC4", label: "\uD30C\uC77C" },
  run:  { emoji: "\uD83D\uDE80", label: "\uC2E4\uD589" },
  ai:   { emoji: "\uD83E\uDD16", label: "AI" },
  tool: { emoji: "\uD83D\uDCE6", label: "\uB3C4\uAD6C" },
  nav:  { emoji: "\uD83D\uDD17", label: "\uC774\uB3D9" },
};

interface Props {
  open: boolean;
  onClose: () => void;
  files: FilesMap;
  openFile: (name: string) => void;
  runProject: () => void;
  publishProject: () => void;
  setLeftTab: React.Dispatch<React.SetStateAction<LeftTab>>;
  setShowNewFile: React.Dispatch<React.SetStateAction<boolean>>;
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  setErrorCount: React.Dispatch<React.SetStateAction<number>>;
  setAiMode: React.Dispatch<React.SetStateAction<string>>;
  aiMode: string;
  router: { push: (url: string) => void };
  setShowCdnModal?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowShortcuts?: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTemplates?: React.Dispatch<React.SetStateAction<boolean>>;
  onCompare?: () => void;
  onTeam?: () => void;
  onParams?: () => void;
  onFormat?: () => void;
  onEnv?: () => void;
  onHistory?: () => void;
  onSplit?: () => void;
  onSearch?: () => void;
}

function fileTypeIcon(name: string) {
  if (name.endsWith(".html")) return <span style={{ color: "#e44d26" }}>\u2B21</span>;
  if (name.endsWith(".css"))  return <span style={{ color: "#264de4" }}>\u2B21</span>;
  if (name.endsWith(".js"))   return <span style={{ color: "#f7df1e" }}>\u2B21</span>;
  if (name.endsWith(".ts"))   return <span style={{ color: "#3178c6" }}>\u2B21</span>;
  if (name.endsWith(".py"))   return <span style={{ color: "#3572a5" }}>\u2B21</span>;
  if (name.endsWith(".json")) return <span style={{ color: "#aaa" }}>\u2B21</span>;
  return <span style={{ color: T.muted }}>\u2B21</span>;
}

export function CommandPalette({
  open, onClose, files, openFile, runProject, publishProject,
  setLeftTab, setShowNewFile, setLogs, setErrorCount, setAiMode, aiMode, router,
  setShowCdnModal, setShowShortcuts, setShowTemplates,
  onCompare, onTeam, onParams, onFormat, onEnv, onHistory, onSplit, onSearch,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // -- File items --
  const fileItems: CommandItem[] = Object.keys(files).sort().map(name => ({
    category: "file" as CommandCategory,
    icon: fileTypeIcon(name),
    label: name,
    description: "\uD30C\uC77C \uC5F4\uAE30",
    action: () => { openFile(name); onClose(); },
  }));

  // -- Categorized command items --
  const commandItems: CommandItem[] = [
    // === \uD30C\uC77C ===
    {
      category: "file", icon: "\uD83D\uDCC4", label: "\uC0C8 \uD30C\uC77C \uB9CC\uB4E4\uAE30", description: "\uD30C\uC77C \uC0DD\uC131",
      shortcut: "Ctrl+N",
      action: () => { setShowNewFile(true); setLeftTab("files"); onClose(); },
    },
    {
      category: "file", icon: "\uD83D\uDCC1", label: "\uD30C\uC77C \uD0D0\uC0C9\uAE30", description: "\uD30C\uC77C \uD328\uB110 \uC5F4\uAE30",
      shortcut: "Ctrl+B",
      action: () => { setLeftTab("files"); onClose(); },
    },
    {
      category: "file", icon: "\uD83D\uDD0D", label: "\uD30C\uC77C \uB0B4\uC6A9 \uAC80\uC0C9", description: "\uD30C\uC77C \uB0B4\uC6A9 \uAC80\uC0C9",
      shortcut: "Ctrl+Shift+F",
      action: () => { onSearch?.(); onClose(); },
    },

    // === \uC2E4\uD589 ===
    {
      category: "run", icon: "\u25B6", label: "\uD504\uB85C\uC81D\uD2B8 \uC2E4\uD589", description: "\uBBF8\uB9AC\uBCF4\uAE30 \uC0C8\uB85C\uACE0\uCE68",
      shortcut: "Ctrl+Enter",
      action: () => { runProject(); onClose(); },
    },
    {
      category: "run", icon: "\uD83D\uDE80", label: "\uD504\uB85C\uC81D\uD2B8 \uBC30\uD3EC", description: "\uC571 \uBC30\uD3EC \uBC0F \uACF5\uAC1C URL \uC0DD\uC131",
      action: () => { publishProject(); onClose(); },
    },

    // === AI ===
    {
      category: "ai", icon: "\u2726", label: "AI \uCC44\uD305 \uC5F4\uAE30", description: "AI \uD328\uB110 \uC5F4\uAE30",
      shortcut: "Ctrl+J",
      action: () => { setLeftTab("ai"); onClose(); },
    },
    {
      category: "ai", icon: "\uD83D\uDD0D", label: "\uCF54\uB4DC \uB9AC\uBDF0", description: "AI\uC5D0\uAC8C \uCF54\uB4DC \uB9AC\uBDF0 \uC694\uCCAD",
      action: () => { setLeftTab("ai"); onClose(); },
    },
    {
      category: "ai", icon: "\uD83D\uDCE6", label: "\uD15C\uD50C\uB9BF \uAC24\uB7EC\uB9AC", description: "\uC989\uC2DC \uC0DD\uC131 \uD15C\uD50C\uB9BF \uBCF4\uAE30",
      action: () => { setShowTemplates?.(true); onClose(); },
    },
    {
      category: "ai", icon: "\uD83D\uDCCA", label: "\uBAA8\uB378 \uBE44\uAD50", description: "\uBAA8\uB378 \uBE44\uAD50",
      action: () => { onCompare?.(); onClose(); },
    },
    {
      category: "ai", icon: "\uD83E\uDD16", label: "AI \uD300 \uBAA8\uB4DC", description: "AI \uD300 \uBAA8\uB4DC",
      action: () => { onTeam?.(); onClose(); },
    },
    {
      category: "ai", icon: "\u2699\uFE0F", label: "AI \uC124\uC815 (Temperature/Tokens)", description: "AI \uC124\uC815",
      action: () => { onParams?.(); onClose(); },
    },
    // AI model switching
    ...AI_MODELS.map(m => ({
      category: "ai" as CommandCategory,
      icon: <span style={{ color: aiMode === m.provider ? T.accent : T.muted }}>{aiMode === m.provider ? "\u25CF" : "\u25CB"}</span>,
      label: `\uBAA8\uB378: ${m.label}`,
      description: m.description,
      action: () => { setAiMode(m.provider); onClose(); },
    })),

    // === \uB3C4\uAD6C ===
    {
      category: "tool", icon: "\uD83D\uDCE6", label: "CDN \uAD00\uB9AC", description: "\uC678\uBD80 \uB77C\uC774\uBE0C\uB7EC\uB9AC \uCD94\uAC00/\uC81C\uAC70",
      action: () => { setShowCdnModal?.(true); onClose(); },
    },
    {
      category: "tool", icon: "\u2699", label: "\uC124\uC815", description: "API \uD0A4 \uAD00\uB9AC",
      action: () => { router.push("/settings"); onClose(); },
    },
    {
      category: "tool", icon: "\u2328", label: "\uB2E8\uCD95\uD0A4 \uB3C4\uC6C0\uB9D0", description: "\uD0A4\uBCF4\uB4DC \uB2E8\uCD95\uD0A4 \uBAA9\uB85D",
      shortcut: "Ctrl+/",
      action: () => { setShowShortcuts?.(true); onClose(); },
    },
    {
      category: "tool", icon: "\uD83D\uDDD1", label: "\uCF58\uC194 \uC9C0\uC6B0\uAE30", description: "\uB85C\uADF8 \uBC0F \uC5D0\uB7EC \uCD08\uAE30\uD654",
      action: () => { setLogs([]); setErrorCount(0); onClose(); },
    },
    {
      category: "tool", icon: "\u2728", label: "\uCF54\uB4DC \uC815\uB9AC", description: "\uCF54\uB4DC \uC815\uB9AC",
      shortcut: "Alt+Shift+F",
      action: () => { onFormat?.(); onClose(); },
    },
    {
      category: "tool", icon: "\uD83D\uDD11", label: "\uD658\uACBD\uBCC0\uC218 \uAD00\uB9AC", description: "\uD658\uACBD\uBCC0\uC218 \uAD00\uB9AC",
      action: () => { onEnv?.(); onClose(); },
    },
    {
      category: "tool", icon: "\uD83D\uDCDC", label: "\uBC84\uC804 \uD788\uC2A4\uD1A0\uB9AC", description: "\uBC84\uC804 \uD788\uC2A4\uD1A0\uB9AC",
      action: () => { onHistory?.(); onClose(); },
    },
    {
      category: "tool", icon: "\u23B8\u23B8", label: "\uC5D0\uB514\uD130 \uBD84\uD560", description: "\uC5D0\uB514\uD130 \uBD84\uD560",
      shortcut: "Ctrl+\\",
      action: () => { onSplit?.(); onClose(); },
    },

    // === \uC774\uB3D9 ===
    {
      category: "nav", icon: "\uD83C\uDFE0", label: "\uB300\uC2DC\uBCF4\uB4DC", description: "\uD648 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9",
      action: () => { router.push("/"); onClose(); },
    },
    {
      category: "nav", icon: "\u2699", label: "\uC124\uC815 \uD398\uC774\uC9C0", description: "API \uD0A4 \uBC0F \uACC4\uC815 \uC124\uC815",
      action: () => { router.push("/settings"); onClose(); },
    },
    {
      category: "nav", icon: "\uD83D\uDC65", label: "\uD300", description: "\uD300 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9",
      action: () => { router.push("/team"); onClose(); },
    },
    {
      category: "nav", icon: "\u2601", label: "\uD074\uB77C\uC6B0\uB4DC", description: "\uD074\uB77C\uC6B0\uB4DC \uD30C\uC77C \uAD00\uB9AC",
      action: () => { router.push("/cloud"); onClose(); },
    },
    {
      category: "nav", icon: "\uD83E\uDDE0", label: "LM Playground", description: "AI \uBAA8\uB378 \uD14C\uC2A4\uD2B8",
      action: () => { router.push("/lm"); onClose(); },
    },
  ];

  const allItems = [...fileItems, ...commandItems];

  const filtered = query.trim()
    ? allItems.filter(item => {
        const q = query.toLowerCase();
        const catLabel = CATEGORY_META[item.category]?.label ?? "";
        return (
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          catLabel.toLowerCase().includes(q)
        );
      })
    : allItems;

  // Group by category in display order
  const categoryOrder: CommandCategory[] = ["file", "run", "ai", "tool", "nav"];
  const grouped = categoryOrder
    .map(cat => ({
      cat,
      items: filtered.filter(i => i.category === cat),
    }))
    .filter(g => g.items.length > 0);

  // Flat list for keyboard navigation
  const flatItems = grouped.flatMap(g => g.items);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActiveIdx(0), [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatItems.length - 1)); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter")     { e.preventDefault(); flatItems[activeIdx]?.action(); }
  }, [flatItems, activeIdx, onClose]);

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 500,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "12vh",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
        style={{
          width: "min(660px, 92vw)",
          background: T.surface,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 14,
          boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(249,115,22,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", padding: "12px 16px",
          borderBottom: `1px solid ${T.border}`, gap: 10,
          background: "rgba(255,255,255,0.02)",
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={T.muted} strokeWidth="1.6" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5L14 14"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="\uD30C\uC77C, \uBA85\uB839\uC5B4, \uCE74\uD14C\uACE0\uB9AC \uAC80\uC0C9..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: T.text, fontSize: 14, fontFamily: "inherit",
            }}
          />
          <kbd style={{
            fontSize: 10, color: T.muted,
            background: "rgba(255,255,255,0.07)",
            padding: "2px 7px", borderRadius: 5,
            border: `1px solid ${T.border}`,
            fontFamily: "inherit",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 420, overflowY: "auto" }}>
          {flatItems.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: T.muted, fontSize: 13 }}>
              \uACB0\uACFC \uC5C6\uC74C
            </div>
          ) : (
            grouped.map((group, gi) => {
              const meta = CATEGORY_META[group.cat];
              return (
                <div key={group.cat}>
                  {/* Category header with separator */}
                  <div style={{
                    padding: "8px 16px 4px", fontSize: 10, color: T.muted,
                    fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    borderTop: gi > 0 ? `1px solid ${T.border}` : "none",
                    marginTop: gi > 0 ? 4 : 0,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </div>

                  {/* Items in this category */}
                  {group.items.map(item => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <div
                        key={`${group.cat}-${item.label}-${idx}`}
                        data-idx={idx}
                        onClick={item.action}
                        onMouseEnter={() => setActiveIdx(idx)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "7px 16px", cursor: "pointer",
                          background: activeIdx === idx ? "rgba(249,115,22,0.08)" : "transparent",
                          borderLeft: activeIdx === idx ? `2px solid ${T.accent}` : "2px solid transparent",
                          transition: "all 0.08s",
                        }}
                      >
                        <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{item.icon}</span>
                        <span style={{
                          flex: 1, fontSize: 13,
                          color: activeIdx === idx ? T.accent : T.text,
                          fontWeight: activeIdx === idx ? 600 : 400,
                        }}>
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <kbd style={{
                            fontSize: 9, color: T.muted,
                            background: "rgba(255,255,255,0.05)",
                            padding: "1px 6px", borderRadius: 4,
                            border: `1px solid ${T.border}`,
                            fontFamily: "inherit",
                            letterSpacing: "0.03em",
                          }}>{item.shortcut}</kbd>
                        )}
                        <span style={{ fontSize: 11, color: T.muted }}>{item.description}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          {/* Bottom padding */}
          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
}
