"use client";

import React, { useState, useCallback, useRef } from "react";
import { T } from "./workspace.constants";
import { useFileSystemStore, useUiStore } from "./stores";

// ── Types ──────────────────────────────────────────────────────────────────────

type ComponentType =
  | "container" | "row" | "column" | "grid"
  | "heading" | "text" | "image" | "button" | "link"
  | "input" | "textarea" | "select" | "checkbox"
  | "video" | "card" | "list";

interface BuilderComponent {
  id: string;
  type: ComponentType;
  props: Record<string, string>;
  children: BuilderComponent[];
}

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: string;
  category: string;
}

const COMPONENT_PALETTE: PaletteItem[] = [
  // Layout
  { type: "container", label: "컨테이너", icon: "□", category: "layout" },
  { type: "row", label: "행", icon: "≡", category: "layout" },
  { type: "column", label: "열", icon: "∥", category: "layout" },
  { type: "grid", label: "그리드", icon: "⊞", category: "layout" },
  // Content
  { type: "heading", label: "제목", icon: "H", category: "content" },
  { type: "text", label: "텍스트", icon: "T", category: "content" },
  { type: "image", label: "이미지", icon: "▣", category: "content" },
  { type: "button", label: "버튼", icon: "⊡", category: "content" },
  { type: "link", label: "링크", icon: "⇗", category: "content" },
  // Form
  { type: "input", label: "입력", icon: "▭", category: "form" },
  { type: "textarea", label: "텍스트영역", icon: "▯", category: "form" },
  { type: "select", label: "선택", icon: "▾", category: "form" },
  { type: "checkbox", label: "체크박스", icon: "☑", category: "form" },
  // Media/Complex
  { type: "video", label: "비디오", icon: "▶", category: "media" },
  { type: "card", label: "카드", icon: "▣", category: "media" },
  { type: "list", label: "목록", icon: "☰", category: "media" },
];

const CATEGORIES = [
  { key: "layout", label: "레이아웃" },
  { key: "content", label: "콘텐츠" },
  { key: "form", label: "폼" },
  { key: "media", label: "미디어" },
];

// ── Default props per component type ───────────────────────────────────────────

function defaultProps(type: ComponentType): Record<string, string> {
  switch (type) {
    case "container": return { maxWidth: "1200px", padding: "20px", background: "#ffffff" };
    case "row": return { gap: "16px", alignItems: "center" };
    case "column": return { gap: "12px" };
    case "grid": return { columns: "3", gap: "16px" };
    case "heading": return { text: "제목 텍스트", level: "2", color: "#1b1b1f", fontSize: "24px" };
    case "text": return { text: "본문 텍스트를 입력하세요.", color: "#4b5563", fontSize: "16px" };
    case "image": return { src: "https://placehold.co/400x250", alt: "이미지", width: "100%", borderRadius: "8px" };
    case "button": return { text: "버튼", background: "#f97316", color: "#ffffff", padding: "12px 24px", borderRadius: "8px", fontSize: "14px" };
    case "link": return { text: "링크 텍스트", href: "#", color: "#2563eb", fontSize: "14px" };
    case "input": return { placeholder: "입력하세요...", type: "text", width: "100%" };
    case "textarea": return { placeholder: "내용을 입력하세요...", rows: "4", width: "100%" };
    case "select": return { options: "옵션1,옵션2,옵션3", width: "100%" };
    case "checkbox": return { label: "체크박스 라벨" };
    case "video": return { src: "", width: "100%", poster: "" };
    case "card": return { title: "카드 제목", description: "카드 설명 텍스트입니다.", background: "#ffffff", borderRadius: "12px", padding: "20px" };
    case "list": return { items: "항목 1,항목 2,항목 3", listStyle: "disc" };
    default: return {};
  }
}

// ── Editable property definitions per type ─────────────────────────────────────

interface PropDef {
  key: string;
  label: string;
  type: "text" | "color" | "number" | "select";
  options?: string[];
}

function getPropDefs(type: ComponentType): PropDef[] {
  switch (type) {
    case "container": return [
      { key: "maxWidth", label: "최대너비", type: "text" },
      { key: "padding", label: "패딩", type: "text" },
      { key: "background", label: "배경색", type: "color" },
    ];
    case "row": return [
      { key: "gap", label: "간격", type: "text" },
      { key: "alignItems", label: "정렬", type: "select", options: ["flex-start", "center", "flex-end", "stretch"] },
    ];
    case "column": return [
      { key: "gap", label: "간격", type: "text" },
    ];
    case "grid": return [
      { key: "columns", label: "열 수", type: "number" },
      { key: "gap", label: "간격", type: "text" },
    ];
    case "heading": return [
      { key: "text", label: "텍스트", type: "text" },
      { key: "level", label: "레벨(1-6)", type: "select", options: ["1", "2", "3", "4", "5", "6"] },
      { key: "color", label: "색상", type: "color" },
      { key: "fontSize", label: "크기", type: "text" },
    ];
    case "text": return [
      { key: "text", label: "텍스트", type: "text" },
      { key: "color", label: "색상", type: "color" },
      { key: "fontSize", label: "크기", type: "text" },
    ];
    case "image": return [
      { key: "src", label: "URL", type: "text" },
      { key: "alt", label: "대체 텍스트", type: "text" },
      { key: "width", label: "너비", type: "text" },
      { key: "borderRadius", label: "모서리", type: "text" },
    ];
    case "button": return [
      { key: "text", label: "텍스트", type: "text" },
      { key: "background", label: "배경색", type: "color" },
      { key: "color", label: "글자색", type: "color" },
      { key: "padding", label: "패딩", type: "text" },
      { key: "borderRadius", label: "모서리", type: "text" },
      { key: "fontSize", label: "크기", type: "text" },
    ];
    case "link": return [
      { key: "text", label: "텍스트", type: "text" },
      { key: "href", label: "URL", type: "text" },
      { key: "color", label: "색상", type: "color" },
      { key: "fontSize", label: "크기", type: "text" },
    ];
    case "input": return [
      { key: "placeholder", label: "플레이스홀더", type: "text" },
      { key: "type", label: "타입", type: "select", options: ["text", "email", "password", "number", "tel", "url"] },
      { key: "width", label: "너비", type: "text" },
    ];
    case "textarea": return [
      { key: "placeholder", label: "플레이스홀더", type: "text" },
      { key: "rows", label: "행 수", type: "number" },
      { key: "width", label: "너비", type: "text" },
    ];
    case "select": return [
      { key: "options", label: "옵션(쉼표 구분)", type: "text" },
      { key: "width", label: "너비", type: "text" },
    ];
    case "checkbox": return [
      { key: "label", label: "라벨", type: "text" },
    ];
    case "video": return [
      { key: "src", label: "URL", type: "text" },
      { key: "width", label: "너비", type: "text" },
      { key: "poster", label: "포스터 URL", type: "text" },
    ];
    case "card": return [
      { key: "title", label: "제목", type: "text" },
      { key: "description", label: "설명", type: "text" },
      { key: "background", label: "배경색", type: "color" },
      { key: "borderRadius", label: "모서리", type: "text" },
      { key: "padding", label: "패딩", type: "text" },
    ];
    case "list": return [
      { key: "items", label: "항목(쉼표 구분)", type: "text" },
      { key: "listStyle", label: "스타일", type: "select", options: ["disc", "circle", "square", "decimal", "none"] },
    ];
    default: return [];
  }
}

// ── Unique ID generator ────────────────────────────────────────────────────────

let _idCounter = 0;
function genId(): string {
  _idCounter++;
  return `vb_${Date.now()}_${_idCounter}`;
}

// ── Can have children? ──────────────────────────────────────────────────────────

function canHaveChildren(type: ComponentType): boolean {
  return ["container", "row", "column", "grid", "card"].includes(type);
}

// ── HTML/CSS code generation ───────────────────────────────────────────────────

function generateCSS(components: BuilderComponent[]): string {
  const lines: string[] = [];
  lines.push("* { box-sizing: border-box; margin: 0; padding: 0; }");
  lines.push("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }");
  lines.push("");

  function walk(comps: BuilderComponent[]) {
    for (const c of comps) {
      const cls = `vb-${c.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const p = c.props;
      const rules: string[] = [];

      switch (c.type) {
        case "container":
          rules.push(`max-width: ${p.maxWidth || "1200px"}`);
          rules.push("margin: 0 auto");
          rules.push(`padding: ${p.padding || "20px"}`);
          if (p.background) rules.push(`background: ${p.background}`);
          break;
        case "row":
          rules.push("display: flex");
          rules.push("flex-wrap: wrap");
          rules.push(`gap: ${p.gap || "16px"}`);
          if (p.alignItems) rules.push(`align-items: ${p.alignItems}`);
          break;
        case "column":
          rules.push("display: flex");
          rules.push("flex-direction: column");
          rules.push(`gap: ${p.gap || "12px"}`);
          rules.push("flex: 1");
          break;
        case "grid":
          rules.push("display: grid");
          rules.push(`grid-template-columns: repeat(${p.columns || "3"}, 1fr)`);
          rules.push(`gap: ${p.gap || "16px"}`);
          break;
        case "heading":
          if (p.color) rules.push(`color: ${p.color}`);
          if (p.fontSize) rules.push(`font-size: ${p.fontSize}`);
          rules.push("font-weight: 700");
          break;
        case "text":
          if (p.color) rules.push(`color: ${p.color}`);
          if (p.fontSize) rules.push(`font-size: ${p.fontSize}`);
          rules.push("line-height: 1.6");
          break;
        case "image":
          if (p.width) rules.push(`width: ${p.width}`);
          rules.push("height: auto");
          if (p.borderRadius) rules.push(`border-radius: ${p.borderRadius}`);
          rules.push("display: block");
          break;
        case "button":
          if (p.background) rules.push(`background: ${p.background}`);
          if (p.color) rules.push(`color: ${p.color}`);
          if (p.padding) rules.push(`padding: ${p.padding}`);
          if (p.borderRadius) rules.push(`border-radius: ${p.borderRadius}`);
          if (p.fontSize) rules.push(`font-size: ${p.fontSize}`);
          rules.push("border: none");
          rules.push("cursor: pointer");
          rules.push("font-weight: 600");
          rules.push("transition: opacity 0.2s");
          break;
        case "link":
          if (p.color) rules.push(`color: ${p.color}`);
          if (p.fontSize) rules.push(`font-size: ${p.fontSize}`);
          rules.push("text-decoration: none");
          break;
        case "input":
          if (p.width) rules.push(`width: ${p.width}`);
          rules.push("padding: 10px 14px");
          rules.push("border: 1px solid #d1d5db");
          rules.push("border-radius: 8px");
          rules.push("font-size: 14px");
          rules.push("outline: none");
          rules.push("transition: border-color 0.2s");
          break;
        case "textarea":
          if (p.width) rules.push(`width: ${p.width}`);
          rules.push("padding: 10px 14px");
          rules.push("border: 1px solid #d1d5db");
          rules.push("border-radius: 8px");
          rules.push("font-size: 14px");
          rules.push("outline: none");
          rules.push("resize: vertical");
          rules.push("font-family: inherit");
          break;
        case "select":
          if (p.width) rules.push(`width: ${p.width}`);
          rules.push("padding: 10px 14px");
          rules.push("border: 1px solid #d1d5db");
          rules.push("border-radius: 8px");
          rules.push("font-size: 14px");
          rules.push("outline: none");
          rules.push("background: #fff");
          break;
        case "checkbox":
          rules.push("display: flex");
          rules.push("align-items: center");
          rules.push("gap: 8px");
          rules.push("font-size: 14px");
          rules.push("cursor: pointer");
          break;
        case "video":
          if (p.width) rules.push(`width: ${p.width}`);
          rules.push("border-radius: 8px");
          break;
        case "card":
          if (p.background) rules.push(`background: ${p.background}`);
          if (p.borderRadius) rules.push(`border-radius: ${p.borderRadius}`);
          if (p.padding) rules.push(`padding: ${p.padding}`);
          rules.push("box-shadow: 0 2px 12px rgba(0,0,0,0.08)");
          rules.push("border: 1px solid #e5e7eb");
          break;
        case "list":
          if (p.listStyle) rules.push(`list-style: ${p.listStyle}`);
          rules.push("padding-left: 20px");
          rules.push("line-height: 1.8");
          break;
      }

      if (rules.length > 0) {
        lines.push(`.${cls} {`);
        for (const r of rules) lines.push(`  ${r};`);
        lines.push("}");
        lines.push("");
      }

      if (c.type === "button") {
        lines.push(`.${cls}:hover { opacity: 0.85; }`);
        lines.push("");
      }
      if (c.type === "input" || c.type === "textarea" || c.type === "select") {
        lines.push(`.${cls}:focus { border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }`);
        lines.push("");
      }
      if (c.type === "link") {
        lines.push(`.${cls}:hover { text-decoration: underline; }`);
        lines.push("");
      }

      if (c.children.length > 0) walk(c.children);
    }
  }

  walk(components);
  return lines.join("\n");
}

function generateHTML(components: BuilderComponent[]): string {
  function renderComp(c: BuilderComponent, indent: number): string {
    const sp = "  ".repeat(indent);
    const cls = `vb-${c.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const p = c.props;
    const childrenHtml = c.children.map(ch => renderComp(ch, indent + 1)).join("\n");

    switch (c.type) {
      case "container":
      case "column":
        return `${sp}<div class="${cls}">\n${childrenHtml}\n${sp}</div>`;
      case "row":
        return `${sp}<div class="${cls}">\n${childrenHtml}\n${sp}</div>`;
      case "grid":
        return `${sp}<div class="${cls}">\n${childrenHtml}\n${sp}</div>`;
      case "heading": {
        const tag = `h${p.level || "2"}`;
        return `${sp}<${tag} class="${cls}">${escHtml(p.text || "")}</${tag}>`;
      }
      case "text":
        return `${sp}<p class="${cls}">${escHtml(p.text || "")}</p>`;
      case "image":
        return `${sp}<img class="${cls}" src="${escAttr(p.src || "")}" alt="${escAttr(p.alt || "")}" />`;
      case "button":
        return `${sp}<button class="${cls}">${escHtml(p.text || "")}</button>`;
      case "link":
        return `${sp}<a class="${cls}" href="${escAttr(p.href || "#")}">${escHtml(p.text || "")}</a>`;
      case "input":
        return `${sp}<input class="${cls}" type="${escAttr(p.type || "text")}" placeholder="${escAttr(p.placeholder || "")}" />`;
      case "textarea":
        return `${sp}<textarea class="${cls}" rows="${escAttr(p.rows || "4")}" placeholder="${escAttr(p.placeholder || "")}"></textarea>`;
      case "select": {
        const opts = (p.options || "").split(",").map(o => o.trim()).filter(Boolean);
        const optTags = opts.map(o => `${sp}  <option>${escHtml(o)}</option>`).join("\n");
        return `${sp}<select class="${cls}">\n${optTags}\n${sp}</select>`;
      }
      case "checkbox":
        return `${sp}<label class="${cls}"><input type="checkbox" /> ${escHtml(p.label || "")}</label>`;
      case "video":
        return `${sp}<video class="${cls}" controls${p.poster ? ` poster="${escAttr(p.poster)}"` : ""}${p.src ? ` src="${escAttr(p.src)}"` : ""}></video>`;
      case "card":
        return `${sp}<div class="${cls}">\n${sp}  <h3>${escHtml(p.title || "")}</h3>\n${sp}  <p>${escHtml(p.description || "")}</p>\n${childrenHtml ? childrenHtml + "\n" : ""}${sp}</div>`;
      case "list": {
        const items = (p.items || "").split(",").map(i => i.trim()).filter(Boolean);
        const lis = items.map(i => `${sp}  <li>${escHtml(i)}</li>`).join("\n");
        return `${sp}<ul class="${cls}">\n${lis}\n${sp}</ul>`;
      }
      default:
        return `${sp}<div class="${cls}"></div>`;
    }
  }

  return components.map(c => renderComp(c, 2)).join("\n");
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateFullCode(components: BuilderComponent[]): { html: string; css: string } {
  const css = generateCSS(components);
  const bodyHtml = generateHTML(components);

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Visual Builder Output</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="page-wrapper">
${bodyHtml}
  </div>
</body>
</html>`;

  return { html, css };
}

// ── Canvas preview renderer ────────────────────────────────────────────────────

function renderPreview(c: BuilderComponent, selected: string | null, onSelect: (id: string) => void): React.ReactNode {
  const isSelected = selected === c.id;
  const p = c.props;
  const wrapStyle: React.CSSProperties = {
    outline: isSelected ? `2px solid ${T.accent}` : "1px dashed #d1d5db",
    outlineOffset: -1,
    borderRadius: 4,
    cursor: "pointer",
    position: "relative",
    minHeight: 24,
    transition: "outline 0.15s",
  };

  const labelTag = (
    <span style={{
      position: "absolute", top: -10, left: 4, fontSize: 9,
      background: isSelected ? T.accent : "#e5e7eb", color: isSelected ? "#fff" : "#6b7280",
      padding: "1px 5px", borderRadius: 3, fontWeight: 600, zIndex: 1,
      pointerEvents: "none",
    }}>
      {c.type}
    </span>
  );

  const childrenEl = c.children.map(ch => renderPreview(ch, selected, onSelect));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(c.id);
  };

  switch (c.type) {
    case "container":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, maxWidth: p.maxWidth || "100%", padding: p.padding || "16px", background: p.background || "#fff", margin: "8px 0" }}>
          {labelTag}{childrenEl}
        </div>
      );
    case "row":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, display: "flex", flexWrap: "wrap", gap: p.gap || "12px", alignItems: (p.alignItems || "center") as React.CSSProperties["alignItems"], padding: 8, margin: "4px 0" }}>
          {labelTag}{childrenEl}
        </div>
      );
    case "column":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, display: "flex", flexDirection: "column", gap: p.gap || "8px", flex: 1, padding: 8, margin: "4px 0" }}>
          {labelTag}{childrenEl}
        </div>
      );
    case "grid":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, display: "grid", gridTemplateColumns: `repeat(${p.columns || 3}, 1fr)`, gap: p.gap || "12px", padding: 8, margin: "4px 0" }}>
          {labelTag}{childrenEl}
        </div>
      );
    case "heading": {
      const Tag = `h${p.level || "2"}` as keyof JSX.IntrinsicElements;
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <Tag style={{ color: p.color || "#1b1b1f", fontSize: p.fontSize || "24px", fontWeight: 700, margin: 0 }}>
            {p.text || "제목"}
          </Tag>
        </div>
      );
    }
    case "text":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <p style={{ color: p.color || "#4b5563", fontSize: p.fontSize || "14px", lineHeight: 1.6, margin: 0 }}>{p.text || "텍스트"}</p>
        </div>
      );
    case "image":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <div style={{ width: p.width || "100%", height: 80, background: "#f3f4f6", borderRadius: p.borderRadius || "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#9ca3af" }}>
            IMG: {p.alt || "image"}
          </div>
        </div>
      );
    case "button":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0", display: "inline-block" }}>
          {labelTag}
          <span style={{ display: "inline-block", background: p.background || "#f97316", color: p.color || "#fff", padding: p.padding || "8px 16px", borderRadius: p.borderRadius || "6px", fontSize: p.fontSize || "13px", fontWeight: 600 }}>
            {p.text || "버튼"}
          </span>
        </div>
      );
    case "link":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0", display: "inline-block" }}>
          {labelTag}
          <span style={{ color: p.color || "#2563eb", fontSize: p.fontSize || "13px", textDecoration: "underline" }}>{p.text || "링크"}</span>
        </div>
      );
    case "input":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <div style={{ width: p.width || "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, color: "#9ca3af", background: "#fff" }}>
            {p.placeholder || "입력"}
          </div>
        </div>
      );
    case "textarea":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <div style={{ width: p.width || "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, color: "#9ca3af", background: "#fff", minHeight: 50 }}>
            {p.placeholder || "텍스트영역"}
          </div>
        </div>
      );
    case "select":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <div style={{ width: p.width || "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, color: "#4b5563", background: "#fff", display: "flex", justifyContent: "space-between" }}>
            <span>{(p.options || "").split(",")[0] || "선택"}</span>
            <span>▾</span>
          </div>
        </div>
      );
    case "checkbox":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
          {labelTag}
          <div style={{ width: 14, height: 14, border: "1.5px solid #d1d5db", borderRadius: 3 }} />
          <span style={{ fontSize: 12, color: "#4b5563" }}>{p.label || "체크"}</span>
        </div>
      );
    case "video":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <div style={{ width: p.width || "100%", height: 100, background: "#111", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>
            ▶
          </div>
        </div>
      );
    case "card":
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, background: p.background || "#fff", borderRadius: p.borderRadius || "12px", padding: p.padding || "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", margin: "4px 0" }}>
          {labelTag}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.title || "카드"}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.description || ""}</div>
          {childrenEl}
        </div>
      );
    case "list": {
      const items = (p.items || "").split(",").map(i => i.trim()).filter(Boolean);
      return (
        <div key={c.id} onClick={handleClick} style={{ ...wrapStyle, padding: 4, margin: "4px 0" }}>
          {labelTag}
          <ul style={{ paddingLeft: 18, fontSize: 12, color: "#4b5563", listStyle: p.listStyle || "disc", lineHeight: 1.8 }}>
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      );
    }
    default:
      return <div key={c.id} onClick={handleClick} style={wrapStyle}>{labelTag}</div>;
  }
}

// ── Main Panel Component ───────────────────────────────────────────────────────

export interface VisualBuilderPanelProps {
  onClose: () => void;
}

export function VisualBuilderPanel({ onClose }: VisualBuilderPanelProps) {
  const files = useFileSystemStore(s => s.files);
  const setFiles = useFileSystemStore(s => s.setFiles);
  const setActiveFile = useFileSystemStore(s => s.setActiveFile);
  const openTabs = useFileSystemStore(s => s.openTabs);
  const setOpenTabs = useFileSystemStore(s => s.setOpenTabs);
  const showToast = useUiStore(s => s.showToast);

  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<ComponentType | null>(null);
  const [tab, setTab] = useState<"palette" | "tree">("palette");
  const [showCode, setShowCode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Find component by ID (recursive) ────────────────────────────────────────

  const findComponent = useCallback((comps: BuilderComponent[], id: string): BuilderComponent | null => {
    for (const c of comps) {
      if (c.id === id) return c;
      const found = findComponent(c.children, id);
      if (found) return found;
    }
    return null;
  }, []);

  const selectedComp = selectedId ? findComponent(components, selectedId) : null;

  // ── Update a component's props ───────────────────────────────────────────────

  const updateProps = useCallback((id: string, newProps: Record<string, string>) => {
    function walk(comps: BuilderComponent[]): BuilderComponent[] {
      return comps.map(c => {
        if (c.id === id) return { ...c, props: { ...c.props, ...newProps } };
        return { ...c, children: walk(c.children) };
      });
    }
    setComponents(prev => walk(prev));
  }, []);

  // ── Delete a component ───────────────────────────────────────────────────────

  const deleteComponent = useCallback((id: string) => {
    function walk(comps: BuilderComponent[]): BuilderComponent[] {
      return comps.filter(c => c.id !== id).map(c => ({ ...c, children: walk(c.children) }));
    }
    setComponents(prev => walk(prev));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  // ── Move component up/down within its siblings ──────────────────────────────

  const moveComponent = useCallback((id: string, direction: "up" | "down") => {
    function walk(comps: BuilderComponent[]): BuilderComponent[] {
      const idx = comps.findIndex(c => c.id === id);
      if (idx !== -1) {
        const arr = [...comps];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < arr.length) {
          [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
        }
        return arr;
      }
      return comps.map(c => ({ ...c, children: walk(c.children) }));
    }
    setComponents(prev => walk(prev));
  }, []);

  // ── Drag and drop from palette ───────────────────────────────────────────────

  const handleDragStart = useCallback((_e: React.DragEvent, type: ComponentType) => {
    setDraggedType(type);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedType) return;
    const newComp: BuilderComponent = {
      id: genId(),
      type: draggedType,
      props: defaultProps(draggedType),
      children: [],
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedId(newComp.id);
    setDraggedType(null);
  }, [draggedType]);

  const handleChildDrop = useCallback((e: React.DragEvent, parentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedType) return;
    const newComp: BuilderComponent = {
      id: genId(),
      type: draggedType,
      props: defaultProps(draggedType),
      children: [],
    };

    function addChild(comps: BuilderComponent[]): BuilderComponent[] {
      return comps.map(c => {
        if (c.id === parentId && canHaveChildren(c.type)) {
          return { ...c, children: [...c.children, newComp] };
        }
        return { ...c, children: addChild(c.children) };
      });
    }

    setComponents(prev => addChild(prev));
    setSelectedId(newComp.id);
    setDraggedType(null);
  }, [draggedType]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // ── Generate and apply code ──────────────────────────────────────────────────

  const handleGenerateCode = useCallback(() => {
    if (components.length === 0) {
      showToast("캔버스에 컴포넌트를 추가해주세요.");
      return;
    }
    const { html, css } = generateFullCode(components);
    const newFiles = { ...files };
    newFiles["index.html"] = { name: "index.html", language: "html", content: html };
    newFiles["style.css"] = { name: "style.css", language: "css", content: css };
    setFiles(newFiles);
    const tabs = new Set(openTabs);
    tabs.add("index.html");
    tabs.add("style.css");
    setOpenTabs(Array.from(tabs));
    setActiveFile("index.html");
    showToast("Visual Builder 코드가 생성되었습니다!");
  }, [components, files, openTabs, setFiles, setOpenTabs, setActiveFile, showToast]);

  // ── Component tree renderer (for "tree" tab) ────────────────────────────────

  function renderTree(comps: BuilderComponent[], depth: number): React.ReactNode {
    return comps.map(c => {
      const icon = COMPONENT_PALETTE.find(p => p.type === c.type)?.icon || "?";
      const isSelected = selectedId === c.id;
      return (
        <div key={c.id}>
          <div
            onClick={() => setSelectedId(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 8px", paddingLeft: 8 + depth * 14,
              borderRadius: 4, cursor: "pointer", fontSize: 11,
              background: isSelected ? "rgba(249,115,22,0.10)" : "transparent",
              color: isSelected ? T.accent : T.text,
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            <span style={{ opacity: 0.7 }}>{icon}</span>
            <span style={{ flex: 1 }}>{c.type}</span>
            <button
              onClick={e => { e.stopPropagation(); deleteComponent(c.id); }}
              style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 10, padding: "0 2px" }}
              title="삭제"
            >
              ✕
            </button>
          </div>
          {c.children.length > 0 && renderTree(c.children, depth + 1)}
        </div>
      );
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 480, maxWidth: "100%",
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
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M2 6h12" />
            <path d="M6 6v8" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Visual Builder</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setShowCode(!showCode)}
            style={{
              background: showCode ? "rgba(249,115,22,0.10)" : "none", border: `1px solid ${showCode ? T.borderHi : T.border}`,
              color: showCode ? T.accent : T.muted, fontSize: 10, cursor: "pointer",
              padding: "3px 8px", borderRadius: 4, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            {showCode ? "캔버스" : "코드 보기"}
          </button>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {showCode ? (
        /* ── Code view ──────────────────────────────────────────────────────── */
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {components.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
              캔버스에 컴포넌트를 추가하면<br />여기에 코드가 표시됩니다.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, letterSpacing: "0.04em" }}>HTML</div>
              <pre style={{
                background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 8,
                padding: 12, fontSize: 11, lineHeight: 1.5, overflowX: "auto",
                color: T.text, fontFamily: '"JetBrains Mono","Fira Code",monospace', marginBottom: 14,
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {generateFullCode(components).html}
              </pre>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, letterSpacing: "0.04em" }}>CSS</div>
              <pre style={{
                background: "#f9fafb", border: `1px solid ${T.border}`, borderRadius: 8,
                padding: 12, fontSize: 11, lineHeight: 1.5, overflowX: "auto",
                color: T.text, fontFamily: '"JetBrains Mono","Fira Code",monospace',
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {generateFullCode(components).css}
              </pre>
            </>
          )}
        </div>
      ) : (
        /* ── Builder view ───────────────────────────────────────────────────── */
        <>
          {/* Component palette / tree tabs */}
          <div style={{
            display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
          }}>
            {(["palette", "tree"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 600,
                  background: tab === t ? "rgba(249,115,22,0.06)" : "transparent",
                  color: tab === t ? T.accent : T.muted,
                  border: "none", borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t === "palette" ? "컴포넌트" : "트리"}
              </button>
            ))}
          </div>

          {tab === "palette" ? (
            /* ── Palette ──────────────────────────────────────────────────────── */
            <div style={{ padding: "10px 12px", overflowY: "auto", maxHeight: 220, flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
              {CATEGORIES.map(cat => (
                <div key={cat.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.06em", marginBottom: 5, textTransform: "uppercase" }}>
                    {cat.label}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {COMPONENT_PALETTE.filter(p => p.category === cat.key).map(item => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        style={{
                          padding: "5px 10px", borderRadius: 6,
                          border: `1px solid ${T.border}`, background: "#f9fafb",
                          fontSize: 10, cursor: "grab", display: "flex", alignItems: "center", gap: 4,
                          userSelect: "none", transition: "border-color 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = T.borderHi;
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(249,115,22,0.12)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = T.border;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <span style={{ fontSize: 12, lineHeight: 1 }}>{item.icon}</span>
                        <span style={{ color: T.text, fontWeight: 500 }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Tree view ────────────────────────────────────────────────────── */
            <div style={{ padding: "8px 6px", overflowY: "auto", maxHeight: 220, flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
              {components.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: T.muted, fontSize: 11 }}>
                  컴포넌트 없음
                </div>
              ) : renderTree(components, 0)}
            </div>
          )}

          {/* ── Canvas ──────────────────────────────────────────────────────── */}
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleDragOver}
            style={{
              flex: 1, overflowY: "auto", padding: 14,
              background: "#fafbfc",
              minHeight: 120,
            }}
          >
            {components.length === 0 ? (
              <div style={{
                border: "2px dashed #e5e7eb", borderRadius: 12, padding: "40px 20px",
                textAlign: "center", color: T.muted, fontSize: 12, lineHeight: 1.7,
              }}>
                컴포넌트를 여기에 드래그하세요
              </div>
            ) : (
              <div>
                {components.map(c => {
                  const isContainer = canHaveChildren(c.type);
                  return (
                    <div
                      key={c.id}
                      onDrop={isContainer ? (e) => handleChildDrop(e, c.id) : undefined}
                      onDragOver={isContainer ? handleDragOver : undefined}
                    >
                      {renderPreview(c, selectedId, setSelectedId)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Property Editor ──────────────────────────────────────────────── */}
          {selectedComp && (
            <div style={{
              flexShrink: 0, borderTop: `1px solid ${T.border}`,
              padding: "10px 14px", maxHeight: 200, overflowY: "auto",
              background: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                  {selectedComp.type} 속성
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => moveComponent(selectedComp.id, "up")}
                    style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 5px", fontSize: 9, color: T.muted }}>
                    ↑
                  </button>
                  <button onClick={() => moveComponent(selectedComp.id, "down")}
                    style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 5px", fontSize: 9, color: T.muted }}>
                    ↓
                  </button>
                  <button onClick={() => deleteComponent(selectedComp.id)}
                    style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: "2px 5px", fontSize: 9, color: T.red }}>
                    삭제
                  </button>
                </div>
              </div>
              {getPropDefs(selectedComp.type).map(def => (
                <div key={def.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <label style={{ fontSize: 10, color: T.muted, width: 70, flexShrink: 0, fontWeight: 600 }}>
                    {def.label}
                  </label>
                  {def.type === "color" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                      <input
                        type="color"
                        value={selectedComp.props[def.key] || "#000000"}
                        onChange={e => updateProps(selectedComp.id, { [def.key]: e.target.value })}
                        style={{ width: 24, height: 24, border: "none", padding: 0, cursor: "pointer", borderRadius: 4 }}
                      />
                      <input
                        type="text"
                        value={selectedComp.props[def.key] || ""}
                        onChange={e => updateProps(selectedComp.id, { [def.key]: e.target.value })}
                        style={{
                          flex: 1, padding: "4px 8px", border: `1px solid ${T.border}`, borderRadius: 4,
                          fontSize: 10, fontFamily: '"JetBrains Mono",monospace', outline: "none",
                        }}
                      />
                    </div>
                  ) : def.type === "select" ? (
                    <select
                      value={selectedComp.props[def.key] || ""}
                      onChange={e => updateProps(selectedComp.id, { [def.key]: e.target.value })}
                      style={{
                        flex: 1, padding: "4px 6px", border: `1px solid ${T.border}`, borderRadius: 4,
                        fontSize: 10, outline: "none", background: "#fff", fontFamily: "inherit",
                      }}
                    >
                      {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={def.type === "number" ? "number" : "text"}
                      value={selectedComp.props[def.key] || ""}
                      onChange={e => updateProps(selectedComp.id, { [def.key]: e.target.value })}
                      style={{
                        flex: 1, padding: "4px 8px", border: `1px solid ${T.border}`, borderRadius: 4,
                        fontSize: 10, outline: "none", fontFamily: def.type === "number" ? '"JetBrains Mono",monospace' : "inherit",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Generate Code Button ────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={handleGenerateCode}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: components.length === 0 ? T.muted : `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: components.length === 0 ? "default" : "pointer",
            fontFamily: "inherit",
            boxShadow: components.length === 0 ? "none" : "0 2px 14px rgba(249,115,22,0.25)",
          }}
          disabled={components.length === 0}
        >
          코드 생성 및 적용
        </button>
      </div>
    </div>
  );
}
