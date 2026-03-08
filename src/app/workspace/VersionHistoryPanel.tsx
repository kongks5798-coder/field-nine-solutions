"use client";

import React, { useState } from "react";
import { T } from "./workspace.constants";
import type { FilesMap, HistoryEntry } from "./workspace.constants";

// ── Local Version History ────────────────────────────────────────────────────

interface Props {
  history: HistoryEntry[];
  currentFiles: FilesMap;
  onRestore: (restored: FilesMap) => void;
  onClose: () => void;
}

function VersionHistoryPanelInner({ history, onRestore, onClose }: Props) {
  return (
    <div style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 300,
      height: "100%",
      background: T.bg,
      borderLeft: `1px solid ${T.border}`,
      zIndex: 40,
      display: "flex",
      flexDirection: "column",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>🕐 버전 히스토리</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{history.length}개 스냅샷 저장됨</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 4 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {history.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: T.muted, fontSize: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗂</div>
            <div>아직 저장된 버전이 없어요.</div>
            <div style={{ fontSize: 11, marginTop: 6 }}>AI 생성 시 자동으로 스냅샷이 저장됩니다.</div>
          </div>
        ) : (
          [...history].reverse().map((entry, revIdx) => {
            const idx = history.length - 1 - revIdx;
            const fileCount = Object.keys(entry.files).length;
            return (
              <div key={entry.epoch ?? idx} style={{
                margin: "4px 10px", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.surface,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.label || "스냅샷"}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>{entry.ts} · {fileCount}개 파일</div>
                  </div>
                  <button
                    onClick={() => onRestore(entry.files)}
                    style={{
                      flexShrink: 0, padding: "4px 10px", borderRadius: 6,
                      border: `1px solid rgba(249,115,22,0.3)`, background: "rgba(249,115,22,0.08)",
                      color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >복원</button>
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.keys(entry.files).slice(0, 4).map(name => (
                    <span key={name} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: T.muted }}>{name}</span>
                  ))}
                  {fileCount > 4 && <span style={{ fontSize: 9, color: T.muted }}>+{fileCount - 4}개</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default VersionHistoryPanelInner;

// ── Remote (Cloud) Version History ──────────────────────────────────────────

interface RemoteProps {
  projectId: string;
  onRestore: (restored: FilesMap) => void;
  onClose: () => void;
}

export function RemoteVersionHistoryPanel({ projectId, onRestore, onClose }: RemoteProps) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<Array<{ id: string; label: string; ts: string; files: FilesMap }>>([]);
  const [loaded, setLoaded] = useState(false);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(Array.isArray(data.versions) ? data.versions : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
    setLoaded(true);
  };

  return (
    <div style={{
      width: 380, background: T.bg, borderRadius: 14,
      border: `1px solid ${T.border}`, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>☁️ 클라우드 버전 히스토리</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: 16, maxHeight: 400, overflowY: "auto" }}>
        {!loaded ? (
          <button
            onClick={loadVersions}
            disabled={loading}
            style={{
              width: "100%", padding: "10px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.surface, color: T.text,
              fontSize: 12, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "inherit",
            }}
          >
            {loading ? "로딩 중..." : "클라우드 버전 불러오기"}
          </button>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: "center", color: T.muted, fontSize: 12, padding: "20px 0" }}>저장된 클라우드 버전이 없습니다.</div>
        ) : (
          versions.map(v => (
            <div key={v.id} style={{
              padding: "10px 12px", marginBottom: 8, borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.surface,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.label}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{v.ts}</div>
              </div>
              <button
                onClick={() => { onRestore(v.files); onClose(); }}
                style={{
                  padding: "4px 10px", borderRadius: 6,
                  border: `1px solid rgba(249,115,22,0.3)`, background: "rgba(249,115,22,0.08)",
                  color: T.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >복원</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
