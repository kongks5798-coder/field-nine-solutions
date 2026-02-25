"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { T, extToLang } from "./workspace.constants";
import type { FilesMap } from "./workspace.constants";
import { useFileSystemStore, useProjectStore, useUiStore, useGitStore } from "./stores";

// ── Types ──────────────────────────────────────────────────────────────────────

type TemplateCategory = "starter" | "ecommerce" | "dashboard" | "game" | "social" | "portfolio" | "tool" | "ai";

type MarketplaceTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  author: string;
  stars: number;
  forks: number;
  tags: string[];
  files: Record<string, string>;
  createdAt: string;
};

type CategoryInfo = { id: TemplateCategory; label: string; icon: string };

export interface TemplateMarketplacePanelProps {
  onClose: () => void;
}

export function TemplateMarketplacePanel({ onClose }: TemplateMarketplacePanelProps) {
  const setFiles = useFileSystemStore(s => s.setFiles);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const showToast = useUiStore(s => s.showToast);
  const commitAction = useGitStore(s => s.commit);

  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCat, setSelectedCat] = useState<TemplateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<MarketplaceTemplate | null>(null);

  // Load templates
  useEffect(() => {
    import("./ai/templateMarketplace").then(mod => {
      setTemplates(mod.getTemplates());
      setCategories(mod.TEMPLATE_CATEGORIES);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Filter templates
  const filtered = useMemo(() => {
    let list = templates;
    if (selectedCat !== "all") {
      list = list.filter(t => t.category === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [templates, selectedCat, search]);

  // Fork template
  const handleFork = useCallback(async (template: MarketplaceTemplate) => {
    try {
      const mod = await import("./ai/templateMarketplace");
      const result = mod.forkTemplate(template);

      // Convert to FilesMap
      const filesMap: FilesMap = {};
      for (const [name, content] of Object.entries(template.files)) {
        filesMap[name] = { name, language: extToLang(name), content };
      }
      setFiles(filesMap);
      setProjectName(result.projectName);
      commitAction(`Fork: ${template.name}`);
      showToast(`"${template.name}" 포크 완료! ${result.fileCount}개 파일`);
      onClose();
    } catch (err) {
      showToast(`포크 실패: ${String(err)}`);
    }
  }, [setFiles, setProjectName, commitAction, showToast, onClose]);

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 440, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83D\uDECD\uFE0F"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>템플릿 마켓</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.accent,
            background: `${T.accent}15`, padding: "2px 7px", borderRadius: 8,
          }}>{templates.length}</span>
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Search + categories */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="템플릿 검색..."
          style={{
            width: "100%", padding: "8px 10px", background: "#f3f4f6",
            border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
            fontSize: 12, outline: "none", fontFamily: "inherit",
            boxSizing: "border-box", marginBottom: 8,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
          onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          <button onClick={() => setSelectedCat("all")}
            style={{
              padding: "3px 8px", borderRadius: 5,
              border: `1px solid ${selectedCat === "all" ? T.accent : T.border}`,
              background: selectedCat === "all" ? `${T.accent}15` : "#f9fafb",
              color: selectedCat === "all" ? T.accent : T.muted,
              fontSize: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
            }}>전체</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
              style={{
                padding: "3px 8px", borderRadius: 5,
                border: `1px solid ${selectedCat === cat.id ? T.accent : T.border}`,
                background: selectedCat === cat.id ? `${T.accent}15` : "#f9fafb",
                color: selectedCat === cat.id ? T.accent : T.muted,
                fontSize: 10, cursor: "pointer", fontFamily: "inherit",
              }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <>
            {/* Detail view */}
            {selectedTemplate && (
              <div style={{
                padding: "14px", borderRadius: 10, marginBottom: 14,
                background: `${T.accent}06`, border: `1px solid ${T.borderHi}`,
              }}>
                <button onClick={() => setSelectedTemplate(null)}
                  style={{
                    background: "none", border: "none", color: T.muted, cursor: "pointer",
                    fontSize: 11, padding: 0, marginBottom: 8, fontFamily: "inherit",
                  }}>&larr; 목록으로</button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{selectedTemplate.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedTemplate.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{selectedTemplate.author}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 10 }}>
                  {selectedTemplate.description}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {selectedTemplate.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 4,
                      background: "#f3f4f6", color: T.muted, border: `1px solid ${T.border}`,
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 10 }}>
                  {Object.keys(selectedTemplate.files).length}개 파일 · {"\u2B50"} {selectedTemplate.stars} · 포크 {selectedTemplate.forks}
                </div>
                {/* File list */}
                <div style={{ marginBottom: 10 }}>
                  {Object.keys(selectedTemplate.files).map(f => (
                    <div key={f} style={{
                      padding: "3px 8px", fontSize: 11, color: T.text,
                      fontFamily: '"JetBrains Mono",monospace',
                    }}>
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => handleFork(selectedTemplate)}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit", boxShadow: "0 2px 14px rgba(249,115,22,0.25)",
                  }}>
                  이 템플릿으로 시작하기
                </button>
              </div>
            )}

            {/* Template grid */}
            {!selectedTemplate && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 10,
              }}>
                {filtered.map(template => (
                  <div key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    style={{
                      padding: "12px", borderRadius: 10,
                      border: `1px solid ${T.border}`,
                      background: "#f9fafb",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(249,115,22,0.1)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = T.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{template.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 3 }}>
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: 10, color: T.muted, lineHeight: 1.5, marginBottom: 6,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {template.description}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 9, color: T.muted }}>
                        {"\u2B50"} {template.stars}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); handleFork(template); }}
                        style={{
                          padding: "3px 8px", borderRadius: 5,
                          border: `1px solid ${T.accent}`,
                          background: `${T.accent}10`,
                          color: T.accent, fontSize: 9, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>포크</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
