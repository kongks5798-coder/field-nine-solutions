"use client";

import { T, CDN_PKGS } from "./workspace.constants";

interface CdnModalProps {
  open: boolean;
  onClose: () => void;
  cdnUrls: string[];
  setCdnUrls: (fn: (prev: string[]) => string[]) => void;
  customCdn: string;
  setCustomCdn: (s: string) => void;
  showToast: (msg: string) => void;
  onApply: () => void;
}

export function CdnModal({
  open, onClose, cdnUrls, setCdnUrls,
  customCdn, setCustomCdn, showToast, onApply,
}: CdnModalProps) {
  if (!open) return null;

  function addCustomUrl() {
    const url = customCdn.trim();
    if (!url) return;
    if (!url.startsWith("https://")) { showToast("⚠️ HTTPS URL만 허용됩니다"); return; }
    setCdnUrls(p => [...p, url]);
    setCustomCdn("");
  }

  const customUrls = cdnUrls.filter(u => !CDN_PKGS.map(p => p.url).includes(u));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CDN 패키지 관리자"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 24, width: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>📦 CDN 패키지 관리자</div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18 }}
          >×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {CDN_PKGS.map(pkg => {
              const active = cdnUrls.includes(pkg.url);
              return (
                <div
                  key={pkg.name}
                  role="checkbox"
                  aria-checked={active}
                  tabIndex={0}
                  onClick={() => setCdnUrls(p => active ? p.filter(x => x !== pkg.url) : [...p, pkg.url])}
                  onKeyDown={e => e.key === " " && setCdnUrls(p => active ? p.filter(x => x !== pkg.url) : [...p, pkg.url])}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${active ? T.borderHi : T.border}`,
                    background: active ? `${T.accent}10` : "#fafafa",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${active ? T.accent : T.muted}`,
                    background: active ? T.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {active && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M1 4l3 3 5-6"/></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{pkg.label}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>jsdelivr · {pkg.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom CDN */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>커스텀 CDN URL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={customCdn}
                onChange={e => setCustomCdn(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && customCdn.trim()) addCustomUrl(); }}
                placeholder="https://cdn.jsdelivr.net/..."
                aria-label="커스텀 CDN URL 입력"
                style={{ flex: 1, background: "#f3f4f6", border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
              <button
                onClick={addCustomUrl}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}
              >추가</button>
            </div>
            {customUrls.map(url => (
              <div key={url} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
                <button
                  onClick={() => setCdnUrls(p => p.filter(x => x !== url))}
                  aria-label={`${url} 제거`}
                  style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}
                >×</button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onApply}
          style={{ marginTop: 16, width: "100%", padding: "11px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.accent},${T.accentB})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          적용 및 실행
        </button>
      </div>
    </div>
  );
}
