"use client";

import React, { useState, useRef, useEffect } from "react";
import { T } from "./workspace.constants";
import type { PreviewWidth } from "./workspace.constants";

// Device frame presets
type DevicePreset = {
  id: string;
  icon: string;
  label: string;
  width: number;
  height: number;
};

const DEVICE_PRESETS: DevicePreset[] = [
  { id: "iphoneSE",  icon: "\uD83D\uDCF1", label: "iPhone SE",   width: 375,  height: 667 },
  { id: "iphone14",  icon: "\uD83D\uDCF1", label: "iPhone 14",   width: 390,  height: 844 },
  { id: "galaxyS21", icon: "\uD83D\uDCF1", label: "Galaxy S21",  width: 360,  height: 800 },
  { id: "ipad",      icon: "\uD83D\uDCF1", label: "iPad",        width: 768,  height: 1024 },
  { id: "laptop",    icon: "\uD83D\uDCBB", label: "Laptop",      width: 1280, height: 800 },
  { id: "desktop",   icon: "\uD83D\uDDA5",  label: "Desktop",     width: 1920, height: 1080 },
  { id: "custom",    icon: "\uD83D\uDD32",  label: "\uCEE4\uC2A4\uD140",       width: 0,    height: 0 },
];

export interface PreviewHeaderToolbarProps {
  previewWidth: PreviewWidth;
  previewRefreshing: boolean;
  hasRun: boolean;
  projectName: string;
  autoTesting: boolean;
  isFullPreview: boolean;
  setPreviewWidth: React.Dispatch<React.SetStateAction<PreviewWidth>>;
  setIsFullPreview: React.Dispatch<React.SetStateAction<boolean>>;
  runProject: () => void;
  autoTest: () => void;
  isMobile?: boolean;
  onDeviceChange?: (device: { width: number; height: number; label: string } | null) => void;
}

function PreviewHeaderToolbarInner({
  previewWidth, previewRefreshing, hasRun, projectName, autoTesting, isFullPreview,
  setPreviewWidth, setIsFullPreview, runProject, autoTest, isMobile, onDeviceChange,
}: PreviewHeaderToolbarProps) {
  const iconBtnSize = isMobile ? 36 : 24;
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDeviceMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDeviceMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDeviceMenu]);

  const selectDevice = (preset: DevicePreset) => {
    setSelectedDevice(preset.id);
    setShowDeviceMenu(false);
    if (preset.id === "custom") {
      // Custom: just use current width setting
      setPreviewWidth("full");
      onDeviceChange?.(null);
    } else {
      // Map to closest PreviewWidth for backwards compat
      const w = preset.width;
      if (w <= 375) setPreviewWidth("375");
      else if (w <= 768) setPreviewWidth("768");
      else if (w <= 1280) setPreviewWidth("1280");
      else setPreviewWidth("full");
      onDeviceChange?.({ width: preset.width, height: preset.height, label: preset.label });
    }
  };

  const selectedLabel = selectedDevice
    ? DEVICE_PRESETS.find(d => d.id === selectedDevice)?.label ?? null
    : null;

  return (
    <div style={{ display: "flex", alignItems: "center", height: isMobile ? 44 : 36, background: T.topbar, borderBottom: `1px solid ${T.border}`, padding: "0 8px", gap: 5, flexShrink: 0 }}>
      {/* macOS dots -- hidden on mobile */}
      {!isMobile && (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f85149", cursor: "pointer" }} onClick={() => setIsFullPreview(false)}/>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f0883e" }}/>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#3fb950", cursor: "pointer" }} onClick={runProject}/>
        </div>
      )}

      <button onClick={runProject}
        style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: isMobile ? 20 : 14, padding: isMobile ? "6px 8px" : "2px 4px", lineHeight: 1, minHeight: isMobile ? 36 : undefined }}>{"\u27F3"}</button>

      {/* URL bar */}
      <div style={{
        flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 6,
        padding: "3px 8px", fontSize: 10, color: T.muted,
        border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 5,
        overflow: "hidden",
      }}>
        {previewRefreshing && (
          <div style={{ width: 8, height: 8, border: "1.5px solid rgba(255,255,255,0.2)", borderTopColor: T.accent, borderRadius: "50%", flexShrink: 0, animation: "spin 0.8s linear infinite" }}/>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {hasRun ? `\uBBF8\uB9AC\uBCF4\uAE30 \u203A ${projectName}` : "dalkak.io"}
        </span>
        {selectedLabel && (
          <span style={{
            marginLeft: "auto", fontSize: 9, color: T.accent,
            background: `${T.accent}15`, padding: "1px 6px", borderRadius: 4,
            fontWeight: 600, flexShrink: 0,
          }}>
            {selectedLabel}
          </span>
        )}
      </div>

      {/* Responsive toggles -- hidden on mobile */}
      {!isMobile && ([
        ["full", "\uD83D\uDDA5", "\uC804\uCCB4"],
        ["1280", "\uD83D\uDCBB", "1280"],
        ["768", "\uD83D\uDCF1", "768"],
        ["375", "\uD83D\uDCF1", "375"],
      ] as [PreviewWidth, string, string][]).map(([w, icon, label]) => (
        <button key={w} onClick={() => { setPreviewWidth(w); setSelectedDevice(null); onDeviceChange?.(null); }} title={`${label}px`}
          style={{
            width: 24, height: 24, borderRadius: 5, border: `1px solid ${T.border}`,
            background: previewWidth === w && !selectedDevice ? `${T.accent}20` : "rgba(255,255,255,0.03)",
            color: previewWidth === w && !selectedDevice ? T.accent : T.muted,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontFamily: "inherit",
          }}>{icon}</button>
      ))}

      {/* Device preset dropdown -- hidden on mobile */}
      {!isMobile && (
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowDeviceMenu(p => !p)}
            title="\uB514\uBC14\uC774\uC2A4 \uD504\uB9AC\uC14B"
            style={{
              width: 24, height: 24, borderRadius: 5,
              border: `1px solid ${selectedDevice ? T.borderHi : T.border}`,
              background: selectedDevice ? `${T.accent}20` : "rgba(255,255,255,0.03)",
              color: selectedDevice ? T.accent : T.muted,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontFamily: "inherit",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12v8H2V3zm1 1v6h10V4H3zm-1 8h12v1H2v-1z"/>
            </svg>
          </button>

          {/* Dropdown menu */}
          {showDeviceMenu && (
            <div style={{
              position: "absolute", top: "100%", right: 0, marginTop: 4,
              background: T.surface, border: `1px solid ${T.borderHi}`,
              borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
              zIndex: 100, overflow: "hidden", minWidth: 220,
            }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: "0.06em" }}>
                {"\uB514\uBC14\uC774\uC2A4 \uD504\uB9AC\uC14B"}
              </div>
              {DEVICE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => selectDevice(preset)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 12px", border: "none", cursor: "pointer",
                    background: selectedDevice === preset.id ? "rgba(249,115,22,0.1)" : "transparent",
                    color: selectedDevice === preset.id ? T.accent : T.text,
                    fontSize: 12, fontFamily: "inherit", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (selectedDevice !== preset.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (selectedDevice !== preset.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{preset.icon}</span>
                  <span style={{ flex: 1, fontWeight: selectedDevice === preset.id ? 600 : 400 }}>{preset.label}</span>
                  {preset.width > 0 && (
                    <span style={{ fontSize: 10, color: T.muted }}>
                      {preset.width}&times;{preset.height}
                    </span>
                  )}
                  {selectedDevice === preset.id && (
                    <span style={{ color: T.accent, fontSize: 12 }}>{"\u2713"}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Auto Test */}
      <button onClick={autoTesting ? undefined : autoTest} title="\uC790\uB3D9 \uD14C\uC2A4\uD2B8 \u2014 \uC571 \uC694\uC18C\uB97C \uC790\uB3D9 \uD074\uB9AD"
        style={{
          width: iconBtnSize, height: iconBtnSize, borderRadius: isMobile ? 8 : 5,
          border: `1px solid ${autoTesting ? T.borderHi : T.border}`,
          background: autoTesting ? `${T.accent}20` : "rgba(255,255,255,0.03)",
          color: autoTesting ? T.accent : T.muted,
          cursor: autoTesting ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        {autoTesting
          ? <div style={{ width: 8, height: 8, border: "1.5px solid rgba(249,115,22,0.3)", borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          : <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor"><path d="M0 0l8 5-8 5z"/></svg>
        }
      </button>

      {/* Fullscreen */}
      <button onClick={() => setIsFullPreview(f => !f)}
        style={{ width: iconBtnSize, height: iconBtnSize, borderRadius: isMobile ? 8 : 5, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isFullPreview
          ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3.5h2.5V1M8 3.5H5.5V1M1 5.5h2.5V8M8 5.5H5.5V8"/></svg>
          : <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3V1h2.5M5.5 1H8v2.5M8 6v2H5.5M3.5 8H1V6"/></svg>
        }
      </button>
    </div>
  );
}

export const PreviewHeaderToolbar = React.memo(PreviewHeaderToolbarInner);
