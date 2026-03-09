/**
 * React hook for managing workspace memories.
 * Handles fetch / save / delete and provides utilities for:
 *   - findRelevantMemories: simple keyword matching against tags
 *   - buildMemoryContext: formats memories into a system-prompt injection string
 *   - extractStyleTokens: extracts CSS design tokens from generated CSS
 */

"use client";

import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StyleTokens {
  primaryColor?: string;
  fontFamily?: string;
  theme?: "dark" | "light";
  layout?: "grid" | "flex" | "sidebar";
}

export interface WorkspaceMemory {
  id: string;
  prompt: string;
  tags: string[];
  html_preview: string;
  style_tokens: StyleTokens;
  created_at: string;
}

interface SaveMemoryPayload {
  prompt: string;
  tags: string[];
  html_preview: string;
  style_tokens: StyleTokens;
}

// ── Style Token Extractor ─────────────────────────────────────────────────────

/**
 * Extracts design tokens from a CSS string.
 * - primaryColor: first hex/rgb color found in :root or body selector
 * - fontFamily: first font-family declaration
 * - theme: dark if background color starts with a low-luminance hex (#0–#3)
 * - layout: detected from keyword usage (grid / flex / sidebar)
 */
export function extractStyleTokens(css: string): StyleTokens {
  const tokens: StyleTokens = {};

  // ── Primary color: look in :root {...} or body {...} first, else take the first color ──
  const rootOrBodyBlock = css.match(/(?::root|body)\s*\{([^}]+)\}/)?.[1] ?? css;

  const hexMatch = rootOrBodyBlock.match(/#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/);
  const rgbMatch = rootOrBodyBlock.match(/rgb\([^)]+\)/);
  if (hexMatch) {
    tokens.primaryColor = hexMatch[0];
  } else if (rgbMatch) {
    tokens.primaryColor = rgbMatch[0];
  }

  // ── Font family ──
  const fontMatch = css.match(/font-family\s*:\s*([^;]+)/);
  if (fontMatch) {
    tokens.fontFamily = fontMatch[1].trim().split(",")[0].replace(/['"]/g, "").trim();
  }

  // ── Theme: dark if background is a very dark hex (#000–#333) ──
  const bgMatch = css.match(/background(?:-color)?\s*:\s*(#[0-9A-Fa-f]{3,6})/);
  if (bgMatch) {
    const hex = bgMatch[1].replace("#", "");
    const expanded = hex.length === 3
      ? hex.split("").map(c => c + c).join("")
      : hex;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    // Rough luminance: < 60 → dark
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    tokens.theme = luminance < 60 ? "dark" : "light";
  }

  // ── Layout keywords ──
  const lower = css.toLowerCase();
  if (lower.includes("sidebar") || lower.includes("aside")) {
    tokens.layout = "sidebar";
  } else if (lower.includes("display: grid") || lower.includes("display:grid")) {
    tokens.layout = "grid";
  } else if (lower.includes("display: flex") || lower.includes("display:flex")) {
    tokens.layout = "flex";
  }

  return tokens;
}

// ── Keyword Utilities ─────────────────────────────────────────────────────────

/**
 * Splits a prompt into lowercase word tokens (≥ 2 chars, Korean/Latin).
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,!?.,;:'"()\[\]{}\-_/\\|@#$%^&*+=<>]+/)
    .filter(w => w.length >= 2);
}

/**
 * Finds memories that share at least one keyword with the prompt.
 * Returns memories sorted by match score (most relevant first).
 */
export function findRelevantMemories(
  prompt: string,
  memories: WorkspaceMemory[]
): WorkspaceMemory[] {
  if (!prompt.trim() || memories.length === 0) return [];

  const promptWords = new Set(tokenize(prompt));

  const scored = memories
    .map(m => {
      const tagTokens = m.tags.flatMap(tag => tokenize(tag));
      const promptTokens = tokenize(m.prompt);
      const allTokens = new Set([...tagTokens, ...promptTokens]);

      let score = 0;
      for (const word of promptWords) {
        if (allTokens.has(word)) score += 1;
      }
      return { memory: m, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map(({ memory }) => memory);
}

/**
 * Builds a string to inject into the system prompt.
 * Format:
 *   이전에 만든 앱 스타일 참고:
 *   - 쇼핑몰 앱: 다크 테마, 오렌지 accent
 *   - 포트폴리오: 그리드 레이아웃
 */
export function buildMemoryContext(memories: WorkspaceMemory[]): string {
  if (memories.length === 0) return "";

  const lines = memories.slice(0, 5).map(m => {
    const parts: string[] = [];

    if (m.style_tokens.theme) {
      parts.push(m.style_tokens.theme === "dark" ? "다크 테마" : "라이트 테마");
    }
    if (m.style_tokens.primaryColor) {
      parts.push(`${m.style_tokens.primaryColor} accent`);
    }
    if (m.style_tokens.layout) {
      const layoutLabel: Record<string, string> = {
        grid: "그리드 레이아웃",
        flex: "플렉스 레이아웃",
        sidebar: "사이드바 레이아웃",
      };
      parts.push(layoutLabel[m.style_tokens.layout] ?? m.style_tokens.layout);
    }
    if (m.style_tokens.fontFamily) {
      parts.push(`${m.style_tokens.fontFamily} 폰트`);
    }

    const promptPreview = m.prompt.slice(0, 40) + (m.prompt.length > 40 ? "…" : "");
    const detail = parts.length > 0 ? `: ${parts.join(", ")}` : "";
    return `- ${promptPreview}${detail}`;
  });

  return `이전에 만든 앱 스타일 참고:\n${lines.join("\n")}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseWorkspaceMemoryReturn {
  memories: WorkspaceMemory[];
  loading: boolean;
  fetchMemories: () => Promise<void>;
  saveMemory: (data: SaveMemoryPayload) => Promise<string | null>;
  deleteMemory: (id: string) => Promise<void>;
  findRelevantMemories: (prompt: string) => WorkspaceMemory[];
  buildMemoryContext: (memories: WorkspaceMemory[]) => string;
}

export function useWorkspaceMemory(): UseWorkspaceMemoryReturn {
  const [memories, setMemories] = useState<WorkspaceMemory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory", { method: "GET" });
      if (!res.ok) return;
      const json = (await res.json()) as { memories: WorkspaceMemory[] };
      setMemories(json.memories ?? []);
    } catch {
      // Memory failures must never block generation — silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMemory = useCallback(async (data: SaveMemoryPayload): Promise<string | null> => {
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { ok: boolean; id: string | null };
      if (json.ok && json.id) {
        // Optimistically add to local state
        const newMemory: WorkspaceMemory = {
          id: json.id,
          prompt: data.prompt,
          tags: data.tags,
          html_preview: data.html_preview,
          style_tokens: data.style_tokens,
          created_at: new Date().toISOString(),
        };
        setMemories(prev => [newMemory, ...prev].slice(0, 10));
        return json.id;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    // Optimistic update first
    setMemories(prev => prev.filter(m => m.id !== id));
    try {
      await fetch(`/api/memory?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      // Ignore — memory failures must never block the user
    }
  }, []);

  const findRelevantBound = useCallback(
    (prompt: string) => findRelevantMemories(prompt, memories),
    [memories]
  );

  return {
    memories,
    loading,
    fetchMemories,
    saveMemory,
    deleteMemory,
    findRelevantMemories: findRelevantBound,
    buildMemoryContext,
  };
}
