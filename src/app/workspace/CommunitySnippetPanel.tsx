"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { T } from "./workspace.constants";
import {
  fetchCommunitySnippets,
  submitSnippet,
  SNIPPET_CATEGORIES,
  COMMUNITY_CATEGORY,
  getSnippetsByCategory,
  searchSnippets,
} from "./ai/snippetLibrary";
import type { CommunitySnippet, Snippet } from "./ai/snippetLibrary";

interface Props {
  /** Called when the user clicks a snippet to insert it into the editor */
  onInsert: (code: string) => void;
  /** Currently selected code in the editor (for submit pre-fill) */
  selectedCode?: string;
  /** Current file language hint */
  currentLanguage?: string;
}

const LANG_COLOR: Record<string, string> = {
  html: "#e44d26",
  css: "#264de4",
  javascript: "#f0db4f",
  typescript: "#3178c6",
};

type TabValue = (typeof SNIPPET_CATEGORIES)[number] | typeof COMMUNITY_CATEGORY;

export function CommunitySnippetPanel({ onInsert, selectedCode, currentLanguage }: Props) {
  const [tab, setTab] = useState<TabValue>("JavaScript");
  const [search, setSearch] = useState("");
  const [communitySnippets, setCommunitySnippets] = useState<CommunitySnippet[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  // Submit form state
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("");
  const [submitDesc, setSubmitDesc] = useState("");
  const [submitCategory, setSubmitCategory] = useState("JavaScript");
  const [submitLang, setSubmitLang] = useState<"html" | "css" | "javascript" | "typescript">("javascript");
  const [submitCode, setSubmitCode] = useState(selectedCode ?? "");
  const [submitStatus, setSubmitStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const prevSelectedCode = useRef(selectedCode);
  useEffect(() => {
    if (selectedCode && selectedCode !== prevSelectedCode.current) {
      setSubmitCode(selectedCode);
      prevSelectedCode.current = selectedCode;
    }
  }, [selectedCode]);

  // Fetch community snippets when tab = 커뮤니티
  useEffect(() => {
    if (tab !== COMMUNITY_CATEGORY) return;
    setCommunityLoading(true);
    setCommunityError(null);
    fetchCommunitySnippets(undefined, 20)
      .then(data => setCommunitySnippets(data))
      .catch(() => setCommunityError("불러오기 실패"))
      .finally(() => setCommunityLoading(false));
  }, [tab]);

  const handleSubmit = useCallback(async () => {
    if (!submitLabel.trim() || !submitCode.trim()) return;
    setSubmitting(true);
    setSubmitStatus(null);
    const result = await submitSnippet({
      label: submitLabel.trim(),
      description: submitDesc.trim() || undefined,
      language: submitLang,
      category: submitCategory,
      code: submitCode,
    });
    setSubmitStatus({ ok: result.success, msg: result.message });
    setSubmitting(false);
    if (result.success) {
      setSubmitLabel("");
      setSubmitDesc("");
      setSubmitCode("");
      setTimeout(() => setSubmitStatus(null), 4000);
    }
  }, [submitLabel, submitDesc, submitLang, submitCategory, submitCode]);

  // Local snippets
  const localSnippets: Snippet[] = search
    ? searchSnippets(search)
    : tab !== COMMUNITY_CATEGORY
    ? getSnippetsByCategory(tab)
    : [];

  const categoryBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "3px 8px",
    fontSize: 9,
    borderRadius: 5,
    border: "none",
    background: active ? `${T.accent}22` : "transparent",
    color: active ? T.accent : T.muted,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  const snippetRowStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, background: T.panel, flexShrink: 0 }}>
      {/* ── Tab + search bar ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px", borderBottom: `1px solid ${T.border}`, overflowX: "auto",
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="스니펫 검색..."
          style={{
            flexShrink: 0, width: 120, height: 26, padding: "0 8px",
            fontSize: 11, border: `1px solid ${T.border}`,
            borderRadius: 6, background: "#f3f4f6", color: T.text,
            outline: "none", fontFamily: "inherit",
          }}
        />
        {/* Local category tabs */}
        {SNIPPET_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setTab(cat); setSearch(""); }}
            style={categoryBtnStyle(tab === cat && !search)}
          >
            {cat}
          </button>
        ))}
        {/* Community tab */}
        <button
          onClick={() => { setTab(COMMUNITY_CATEGORY); setSearch(""); }}
          style={{
            ...categoryBtnStyle(tab === COMMUNITY_CATEGORY && !search),
            background: tab === COMMUNITY_CATEGORY && !search
              ? "rgba(34,197,94,0.12)"
              : "transparent",
            color: tab === COMMUNITY_CATEGORY && !search ? "#22c55e" : T.muted,
          }}
        >
          {COMMUNITY_CATEGORY}
        </button>
      </div>

      {/* ── Snippet list ─────────────────────────────────────────────────── */}
      <div style={{ maxHeight: 180, overflowY: "auto", padding: "4px 6px" }}>
        {/* Local snippets */}
        {tab !== COMMUNITY_CATEGORY || search ? (
          localSnippets.length === 0 ? (
            <div style={{ padding: "12px 10px", fontSize: 11, color: T.muted, textAlign: "center" }}>
              결과 없음
            </div>
          ) : (
            localSnippets.map(s => (
              <div
                key={s.id}
                onClick={() => onInsert(s.code)}
                style={snippetRowStyle}
                onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text, minWidth: 100 }}>{s.label}</span>
                <span style={{ fontSize: 10, color: T.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.description}</span>
                <span style={{ fontSize: 9, color: LANG_COLOR[s.language] ?? T.accent, background: `${LANG_COLOR[s.language] ?? T.accent}18`, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                  {s.language}
                </span>
              </div>
            ))
          )
        ) : (
          // Community snippets
          communityLoading ? (
            <div style={{ padding: "16px 10px", fontSize: 11, color: T.muted, textAlign: "center" }}>
              불러오는 중...
            </div>
          ) : communityError ? (
            <div style={{ padding: "12px 10px", fontSize: 11, color: "#ef4444", textAlign: "center" }}>
              {communityError}
            </div>
          ) : communitySnippets.length === 0 ? (
            <div style={{ padding: "12px 10px", fontSize: 11, color: T.muted, textAlign: "center" }}>
              승인된 커뮤니티 스니펫이 없습니다.
            </div>
          ) : (
            communitySnippets.map(s => (
              <div
                key={s.id}
                style={snippetRowStyle}
                onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{s.label}</span>
                    <span style={{ fontSize: 9, color: LANG_COLOR[s.language] ?? T.accent, background: `${LANG_COLOR[s.language] ?? T.accent}18`, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                      {s.language}
                    </span>
                    <span style={{ fontSize: 9, color: "#94a3b8", background: "rgba(148,163,184,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                      {s.category}
                    </span>
                    {s.likes > 0 && (
                      <span style={{ fontSize: 9, color: "#f97316" }}>♥ {s.likes}</span>
                    )}
                  </div>
                  {s.description && (
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.description}
                    </div>
                  )}
                </div>
                {/* Copy button */}
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(s.code).catch(() => undefined);
                  }}
                  title="클립보드에 복사"
                  style={{
                    padding: "3px 8px", fontSize: 9, borderRadius: 5, border: `1px solid ${T.border}`,
                    background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
                >
                  복사
                </button>
                {/* Insert button */}
                <button
                  onClick={() => onInsert(s.code)}
                  title="에디터에 삽입"
                  style={{
                    padding: "3px 8px", fontSize: 9, borderRadius: 5, border: "none",
                    background: `${T.accent}22`, color: T.accent, cursor: "pointer", fontFamily: "inherit",
                    fontWeight: 600, flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${T.accent}33`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${T.accent}22`; }}
                >
                  삽입
                </button>
              </div>
            ))
          )
        )}
      </div>

      {/* ── 제출하기 section ─────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "4px 10px" }}>
        <button
          onClick={() => setShowSubmit(p => !p)}
          style={{
            fontSize: 10, color: T.muted, background: "none", border: "none",
            cursor: "pointer", fontFamily: "inherit", padding: "2px 0",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
        >
          {showSubmit ? "▲ 제출 폼 닫기" : "▼ 커뮤니티에 제출하기"}
        </button>

        {showSubmit && (
          <div style={{ paddingTop: 8, paddingBottom: 6, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                placeholder="제목 (3-80자)"
                value={submitLabel}
                onChange={e => setSubmitLabel(e.target.value)}
                maxLength={80}
                style={{
                  flex: 1, height: 26, padding: "0 8px", fontSize: 11,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  background: "#f3f4f6", color: T.text, outline: "none", fontFamily: "inherit",
                }}
              />
              <input
                placeholder="설명 (선택)"
                value={submitDesc}
                onChange={e => setSubmitDesc(e.target.value)}
                maxLength={200}
                style={{
                  flex: 1, height: 26, padding: "0 8px", fontSize: 11,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  background: "#f3f4f6", color: T.text, outline: "none", fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select
                value={submitCategory}
                onChange={e => setSubmitCategory(e.target.value)}
                style={{
                  height: 26, padding: "0 6px", fontSize: 11,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  background: "#f3f4f6", color: T.text, outline: "none", fontFamily: "inherit",
                }}
              >
                {SNIPPET_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={submitLang}
                onChange={e => setSubmitLang(e.target.value as "html" | "css" | "javascript" | "typescript")}
                style={{
                  height: 26, padding: "0 6px", fontSize: 11,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  background: "#f3f4f6", color: T.text, outline: "none", fontFamily: "inherit",
                }}
              >
                <option value="html">html</option>
                <option value="css">css</option>
                <option value="javascript">javascript</option>
                <option value="typescript">typescript</option>
              </select>
              <button
                onClick={handleSubmit}
                disabled={submitting || !submitLabel.trim() || !submitCode.trim()}
                style={{
                  padding: "0 14px", height: 26, fontSize: 11, fontWeight: 600,
                  borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: submitting || !submitLabel.trim() || !submitCode.trim()
                    ? T.border : T.accent,
                  color: submitting || !submitLabel.trim() || !submitCode.trim()
                    ? T.muted : "#fff",
                  transition: "background 0.15s",
                }}
              >
                {submitting ? "제출 중..." : "제출하기"}
              </button>
            </div>
            <textarea
              placeholder="스니펫 코드 (10-5000자)"
              value={submitCode}
              onChange={e => setSubmitCode(e.target.value)}
              rows={4}
              maxLength={5000}
              style={{
                width: "100%", padding: "6px 8px", fontSize: 11,
                border: `1px solid ${T.border}`, borderRadius: 6,
                background: "#f3f4f6", color: T.text, outline: "none",
                fontFamily: '"JetBrains Mono","Fira Code",monospace',
                resize: "vertical", boxSizing: "border-box",
              }}
            />
            {submitStatus && (
              <div style={{
                fontSize: 11, padding: "4px 8px", borderRadius: 5,
                background: submitStatus.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: submitStatus.ok ? "#22c55e" : "#ef4444",
              }}>
                {submitStatus.msg}
              </div>
            )}
            <div style={{ fontSize: 10, color: T.muted }}>
              ※ 제출된 스니펫은 검토 후 공개됩니다. 1시간에 3개까지 제출 가능.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
