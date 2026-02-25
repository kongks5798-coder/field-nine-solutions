"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { T } from "./workspace.constants";
import type { FilesMap } from "./workspace.constants";
import { fileIcon } from "./workspace.constants";

interface SearchResult {
  filename: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchLength: number;
}

interface FileSearchPanelProps {
  files: FilesMap;
  onOpenFile: (filename: string) => void;
  onGoToLine: (filename: string, line: number) => void;
}

function searchFiles(files: FilesMap, query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  for (const [filename, file] of Object.entries(files)) {
    const lines = file.content.split("\n");
    lines.forEach((line, i) => {
      const idx = line.toLowerCase().indexOf(lowerQuery);
      if (idx !== -1) {
        results.push({
          filename,
          lineNumber: i + 1,
          lineContent: line.trim(),
          matchStart: idx,
          matchLength: query.length,
        });
      }
    });
  }
  return results;
}

const MAX_RESULTS = 200;

export function FileSearchPanel({ files, onOpenFile, onGoToLine }: FileSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search by 200ms
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const allResults = useMemo(() => searchFiles(files, debouncedQuery), [files, debouncedQuery]);
  const results = useMemo(() => allResults.slice(0, MAX_RESULTS), [allResults]);

  // Group results by file
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.filename)) map.set(r.filename, []);
      map.get(r.filename)!.push(r);
    }
    return map;
  }, [results]);

  const fileCount = grouped.size;
  const totalCount = allResults.length;

  const handleClick = useCallback((filename: string, line: number) => {
    onOpenFile(filename);
    // Small delay so the file opens first
    setTimeout(() => onGoToLine(filename, line), 50);
  }, [onOpenFile, onGoToLine]);

  // Render highlighted line content
  const renderLine = useCallback((r: SearchResult) => {
    const text = r.lineContent;
    const lowerText = text.toLowerCase();
    const lowerQ = debouncedQuery.toLowerCase();
    const idx = lowerText.indexOf(lowerQ);
    if (idx === -1) return <span>{text}</span>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + debouncedQuery.length);
    const after = text.slice(idx + debouncedQuery.length);
    return (
      <span>
        {before}
        <span style={{ background: "rgba(249,115,22,0.3)", borderRadius: 2, padding: "0 1px" }}>{match}</span>
        {after}
      </span>
    );
  }, [debouncedQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Search input */}
      <div style={{ padding: "10px 10px 6px", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <svg
            width="13" height="13" viewBox="0 0 16 16" fill="none"
            stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10.5 10.5L14 14" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="파일 내용 검색..."
            style={{
              width: "100%", padding: "7px 10px 7px 28px",
              background: "#f3f4f6", border: `1px solid ${T.border}`,
              borderRadius: 6, color: T.text, fontSize: 12,
              fontFamily: "inherit", outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = T.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = T.border)}
          />
        </div>
      </div>

      {/* Result count or empty state */}
      {debouncedQuery.length >= 2 ? (
        <div style={{ padding: "0 10px 6px", fontSize: 11, color: T.muted, flexShrink: 0 }}>
          {totalCount > 0
            ? `${totalCount > MAX_RESULTS ? `${MAX_RESULTS}+` : totalCount}개 결과 (${fileCount}개 파일)`
            : "검색 결과 없음"}
        </div>
      ) : (
        <div style={{ padding: "24px 16px", textAlign: "center", color: T.muted, fontSize: 12 }}>
          <div style={{ marginBottom: 6, fontSize: 18, opacity: 0.5 }}>&#128269;</div>
          <div>Ctrl+Shift+F로 검색</div>
        </div>
      )}

      {/* Results list */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {Array.from(grouped.entries()).map(([filename, items]) => (
          <div key={filename} style={{ marginBottom: 2 }}>
            {/* File header */}
            <div style={{
              padding: "5px 10px", display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: T.text,
              background: "#fafafa", position: "sticky", top: 0, zIndex: 1,
            }}>
              <span style={{ fontSize: 13 }}>{fileIcon(filename)}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</span>
              <span style={{
                fontSize: 10, padding: "1px 5px", borderRadius: 8,
                background: "rgba(249,115,22,0.15)", color: T.accent, fontWeight: 700,
              }}>{items.length}</span>
            </div>
            {/* Matching lines */}
            {items.map((r, i) => (
              <button
                key={`${r.lineNumber}-${i}`}
                onClick={() => handleClick(r.filename, r.lineNumber)}
                style={{
                  display: "flex", alignItems: "baseline", gap: 8,
                  width: "100%", padding: "4px 10px 4px 22px",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: T.text, fontSize: 12, fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                  textAlign: "left", transition: "background 0.1s",
                  overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ color: "#64748b", fontSize: 10, minWidth: 28, textAlign: "right", flexShrink: 0 }}>
                  {r.lineNumber}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {renderLine(r)}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
