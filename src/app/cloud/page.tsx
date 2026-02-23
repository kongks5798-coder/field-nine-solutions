"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { supabase } from "@/utils/supabase/client";
import { getAuthUser } from "@/utils/supabase/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type FileItem = {
  id: string;
  name: string;
  type: "folder" | "pdf" | "image" | "code" | "doc" | "zip";
  size: string;
  rawSize: number;
  date: string;
  path: string;
  storagePath: string;
  publicUrl?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extToType(name: string): FileItem["type"] {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["ts", "tsx", "js", "jsx", "py", "sql", "sh", "json", "yaml", "yml"].includes(ext)) return "code";
  if (["doc", "docx", "txt", "md"].includes(ext)) return "doc";
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext)) return "zip";
  return "doc";
}

function fmtSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const FILE_TYPE_ICON: Record<FileItem["type"], string> = {
  folder: "📁", pdf: "📄", image: "🖼️", code: "💻", doc: "📝", zip: "📦",
};
const FILE_TYPE_COLOR: Record<FileItem["type"], string> = {
  folder: "#f59e0b", pdf: "#ef4444", image: "#8b5cf6", code: "#3b82f6", doc: "#06b6d4", zip: "#6b7280",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CloudPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };
  const isMobile = useMediaQuery("(max-width: 767px)");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user
  useEffect(() => {
    getAuthUser().then(u => setUserId(u?.id ?? null));
  }, []);

  // Load files from Supabase Storage
  const loadFiles = useCallback(async (uid: string) => {
    setLoadingFiles(true);
    const prefix = `${uid}/`;
    const { data, error } = await supabase.storage.from("files").list(uid, {
      limit: 200, sortBy: { column: "created_at", order: "desc" },
    });
    if (error || !data) { setLoadingFiles(false); return; }

    const items: FileItem[] = data.map(f => {
      const sp = `${prefix}${f.name}`;
      const { data: urlData } = supabase.storage.from("files").getPublicUrl(sp);
      return {
        id: f.id || sp,
        name: f.name,
        type: extToType(f.name),
        size: fmtSize(f.metadata?.size ?? 0),
        rawSize: f.metadata?.size ?? 0,
        date: f.created_at ? f.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        path: "/",
        storagePath: sp,
        publicUrl: urlData?.publicUrl,
      };
    });
    setFiles(items);
    setLoadingFiles(false);
  }, []);

  useEffect(() => {
    if (userId) loadFiles(userId);
    else setLoadingFiles(false);
  }, [userId, loadFiles]);

  // Upload files to Supabase Storage
  const uploadFiles = async (rawFiles: File[]) => {
    if (!userId || rawFiles.length === 0) return;
    setUploading(true);
    let hasError = false;
    for (const file of rawFiles) {
      const storagePath = `${userId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("files").upload(storagePath, file, { upsert: false });
      if (error) {
        hasError = true;
      }
    }
    if (hasError) showToast("파일 업로드 실패");
    await loadFiles(userId);
    setUploading(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(Array.from(e.target.files));
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) uploadFiles(Array.from(e.dataTransfer.files));
  };

  // Delete selected files
  const handleDelete = async () => {
    if (selected.size === 0) return;
    const paths = files.filter(f => selected.has(f.id)).map(f => f.storagePath);
    const { error } = await supabase.storage.from("files").remove(paths);
    if (error) showToast("파일 삭제 실패");
    setSelected(new Set());
    if (userId) loadFiles(userId);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = selectedFolder === "all" ? files : files.filter(f => f.path === selectedFolder);

  const totalSize = files.reduce((a, f) => a + f.rawSize, 0);
  const STORAGE_LIMIT = 100 * 1024 * 1024 * 1024; // 100 GB
  const storagePercent = Math.min((totalSize / STORAGE_LIMIT) * 100, 100);
  const storageBarColor =
    storagePercent > 90 ? "#ef4444"
    : storagePercent >= 70 ? "#f59e0b"
    : "#22c55e";

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden", position: "relative" }}>

        {/* Mobile sidebar backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 20 }}
          />
        )}

        {/* ─── Left sidebar ─────────────────────────────── */}
        <div style={{
          width: 220, flexShrink: 0, background: "#f9fafb",
          borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
          overflow: "hidden",
          ...(isMobile ? {
            position: "absolute", top: 0, left: 0, bottom: 0, zIndex: 21,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease-in-out",
            boxShadow: sidebarOpen ? "4px 0 20px rgba(0,0,0,0.1)" : "none",
          } : {}),
        }}>
          {/* Storage bar */}
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1b1b1f", marginBottom: 12 }}>클라우드</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
              {fmtSize(totalSize)} / 100 GB 사용
            </div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 9999,
                width: `${storagePercent}%`,
                background: storageBarColor,
                transition: "width 0.3s, background 0.3s",
              }} />
            </div>
          </div>

          {/* Upload button */}
          <div style={{ padding: "12px" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !userId}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                background: uploading ? "#e5e7eb" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                color: uploading ? "#9ca3af" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: uploading || !userId ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "업로드 중..." : "업로드"}
            </button>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileInput} />
          </div>

          {/* Folders */}
          <div style={{ flex: 1, overflow: "auto", padding: "0 8px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "8px 8px 4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>폴더</div>
            {[
              { id: "all", label: "📂 모든 파일", count: files.length },
              { id: "/", label: "📁 루트", count: files.filter(f => f.path === "/").length },
            ].map(folder => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                  background: selectedFolder === folder.id ? "#fff7ed" : "transparent",
                  color: selectedFolder === folder.id ? "#f97316" : "#374151",
                  fontWeight: selectedFolder === folder.id ? 600 : 400, fontSize: 13,
                  transition: "all 0.1s",
                }}
              >
                <span>{folder.label}</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{folder.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Main content ──────────────────────────────── */}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {dragging && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 50,
              background: "rgba(249,115,22,0.12)",
              border: "3px dashed #f97316",
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f97316" }}>파일을 여기에 놓아주세요 →</div>
            </div>
          )}

          {/* Toolbar */}
          <div style={{
            padding: isMobile ? "10px 12px" : "12px 20px", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, background: "#fff", flexShrink: 0,
          }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(v => !v)} aria-label="사이드바 토글" style={{
                width: 32, height: 32, borderRadius: 6, border: "1px solid #e5e7eb",
                background: "#f9fafb", fontSize: 14, cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                ☰
              </button>
            )}
            <span style={{ flex: 1, fontSize: isMobile ? 13 : 14, fontWeight: 600, color: "#1b1b1f" }}>
              {filtered.length}개 파일
              {selected.size > 0 && <span style={{ marginLeft: 8, color: "#f97316" }}>· {selected.size}개 선택됨</span>}
            </span>

            {selected.size > 0 && (
              <button onClick={handleDelete} style={{
                padding: isMobile ? "5px 10px" : "6px 14px", borderRadius: 7, border: "1px solid #fecaca",
                background: "#fef2f2", color: "#dc2626", fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: "pointer",
              }}>
                {isMobile ? "🗑" : "🗑 삭제"}
              </button>
            )}

            {isMobile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !userId}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: "none",
                  background: uploading ? "#e5e7eb" : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: "#fff", fontSize: 16, cursor: uploading || !userId ? "not-allowed" : "pointer",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                +
              </button>
            )}

            <div style={{ display: "flex", gap: 4 }}>
              {(["list", "grid"] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)} style={{
                  padding: "5px 10px", borderRadius: 6, border: "none",
                  background: viewMode === v ? "#f97316" : "#f3f4f6",
                  color: viewMode === v ? "#fff" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {v === "list" ? (isMobile ? "≡" : "≡ 목록") : (isMobile ? "⊞" : "⊞ 그리드")}
                </button>
              ))}
            </div>
          </div>

          {/* File list */}
          <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 12 : 20 }}>
            {!userId && (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                로그인이 필요합니다.
              </div>
            )}
            {userId && loadingFiles && (
              <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
                파일 불러오는 중...
              </div>
            )}
            {userId && !loadingFiles && filtered.length === 0 && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: 300, gap: 16, color: "#9ca3af",
              }}>
                <div style={{ fontSize: 48 }}>☁️</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>파일이 없습니다</div>
                <div style={{ fontSize: 13 }}>파일을 드래그하거나 업로드 버튼을 누르세요</div>
              </div>
            )}

            {/* List view */}
            {!loadingFiles && viewMode === "list" && filtered.length > 0 && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                {!isMobile && (
                  <div style={{
                    display: "grid", gridTemplateColumns: "32px 1fr 100px 100px 140px",
                    padding: "8px 16px", background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 11, fontWeight: 700, color: "#9ca3af",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    <div />
                    <div>이름</div>
                    <div>크기</div>
                    <div>날짜</div>
                    <div>작업</div>
                  </div>
                )}
                {filtered.map(f => (
                  isMobile ? (
                    /* Mobile list row: simplified layout */
                    <div key={f.id} onClick={() => toggleSelect(f.id)} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 12px", borderBottom: "1px solid #f3f4f6",
                      background: selected.has(f.id) ? "#fff7ed" : "#fff",
                      cursor: "pointer",
                    }}>
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        onClick={e => e.stopPropagation()}
                        style={{ accentColor: "#f97316", width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{FILE_TYPE_ICON[f.type]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500, color: FILE_TYPE_COLOR[f.type],
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{f.size} · {f.date}</div>
                      </div>
                      {f.publicUrl && (
                        <a href={f.publicUrl} download={f.name} onClick={e => e.stopPropagation()} style={{
                          padding: "4px 8px", borderRadius: 6, border: "1px solid #e5e7eb",
                          background: "#fff", fontSize: 16, color: "#374151", cursor: "pointer",
                          textDecoration: "none", flexShrink: 0,
                        }}>
                          ⬇
                        </a>
                      )}
                    </div>
                  ) : (
                    /* Desktop list row */
                    <div key={f.id} style={{
                      display: "grid", gridTemplateColumns: "32px 1fr 100px 100px 140px",
                      padding: "10px 16px", borderBottom: "1px solid #f3f4f6",
                      alignItems: "center", background: selected.has(f.id) ? "#fff7ed" : "#fff",
                      transition: "background 0.1s",
                    }}>
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        style={{ accentColor: "#f97316", width: 15, height: 15 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span style={{ fontSize: 20 }}>{FILE_TYPE_ICON[f.type]}</span>
                        <span style={{
                          fontSize: 14, fontWeight: 500, color: FILE_TYPE_COLOR[f.type],
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{f.name}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{f.size}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{f.date}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {f.publicUrl && (
                          <a href={f.publicUrl} download={f.name} style={{
                            padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                            background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer",
                            textDecoration: "none",
                          }}>
                            ⬇ 다운로드
                          </a>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {/* Grid view */}
            {!loadingFiles && viewMode === "grid" && filtered.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(140px, 1fr))", gap: isMobile ? 10 : 14 }}>
                {filtered.map(f => (
                  <div
                    key={f.id}
                    onClick={() => toggleSelect(f.id)}
                    style={{
                      padding: 16, borderRadius: 10, border: "1.5px solid",
                      borderColor: selected.has(f.id) ? "#f97316" : "#e5e7eb",
                      background: selected.has(f.id) ? "#fff7ed" : "#fff",
                      cursor: "pointer", textAlign: "center", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{FILE_TYPE_ICON[f.type]}</div>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: "#1b1b1f",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{f.size}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,0.95)', color:'#fff', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:600, zIndex:99999, boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>{toast}</div>}
    </AppShell>
  );
}
