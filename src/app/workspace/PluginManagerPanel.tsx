"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { T } from "./workspace.constants";
import type {
  PluginManifest,
  PluginInstance,
  PluginCapability,
} from "./ai/pluginSystem";

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewMode = "installed" | "marketplace" | "detail";

export interface PluginManagerPanelProps {
  onClose: () => void;
}

// ── Capability badge helpers ────────────────────────────────────────────────────

const CAPABILITY_LABELS: Record<PluginCapability, string> = {
  panel: "\uD328\uB110",
  command: "\uBA85\uB839\uC5B4",
  "ai-model": "AI \uBAA8\uB378",
  theme: "\uD14C\uB9C8",
  snippet: "\uC2A4\uB2C8\uD3AB",
  "deploy-target": "\uBC30\uD3EC \uB300\uC0C1",
};

const CAPABILITY_COLORS: Record<PluginCapability, string> = {
  panel: "#8b5cf6",
  command: "#3b82f6",
  "ai-model": "#f59e0b",
  theme: "#ec4899",
  snippet: "#10b981",
  "deploy-target": "#ef4444",
};

// ── Main Component ──────────────────────────────────────────────────────────────

export function PluginManagerPanel({ onClose }: PluginManagerPanelProps) {
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [builtinManifests, setBuiltinManifests] = useState<PluginManifest[]>([]);
  const [view, setView] = useState<ViewMode>("marketplace");
  const [search, setSearch] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [selectedInstalled, setSelectedInstalled] = useState<PluginInstance | null>(null);
  const [loading, setLoading] = useState(true);

  // Load plugin registry and built-in list
  useEffect(() => {
    import("./ai/pluginSystem").then(mod => {
      const registry = mod.getPluginRegistry();
      setPlugins(registry.getAllPlugins());
      setBuiltinManifests(mod.BUILTIN_PLUGINS);
      setLoading(false);

      // Listen for changes
      const refresh = () => setPlugins(registry.getAllPlugins());
      registry.on("plugin:installed", refresh);
      registry.on("plugin:uninstalled", refresh);
      registry.on("plugin:activated", refresh);
      registry.on("plugin:deactivated", refresh);
      return () => {
        registry.off("plugin:installed", refresh);
        registry.off("plugin:uninstalled", refresh);
        registry.off("plugin:activated", refresh);
        registry.off("plugin:deactivated", refresh);
      };
    }).catch(() => setLoading(false));
  }, []);

  // Plugin operations
  const handleInstall = useCallback(async (manifest: PluginManifest) => {
    const mod = await import("./ai/pluginSystem");
    const registry = mod.getPluginRegistry();
    registry.install(manifest);
    registry.activate(manifest.id);
    setPlugins(registry.getAllPlugins());
  }, []);

  const handleUninstall = useCallback(async (pluginId: string) => {
    const mod = await import("./ai/pluginSystem");
    const registry = mod.getPluginRegistry();
    registry.uninstall(pluginId);
    setPlugins(registry.getAllPlugins());
    setSelectedInstalled(null);
  }, []);

  const handleToggleActive = useCallback(async (pluginId: string, currentState: string) => {
    const mod = await import("./ai/pluginSystem");
    const registry = mod.getPluginRegistry();
    if (currentState === "active") {
      registry.deactivate(pluginId);
    } else {
      registry.activate(pluginId);
    }
    setPlugins(registry.getAllPlugins());
  }, []);

  // Check if a builtin manifest is already installed
  const isInstalled = useCallback((id: string) => {
    return plugins.some(p => p.manifest.id === id);
  }, [plugins]);

  // Filter marketplace
  const filteredMarketplace = useMemo(() => {
    if (!search.trim()) return builtinManifests;
    const q = search.toLowerCase();
    return builtinManifests.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.capabilities.some(c => c.toLowerCase().includes(q))
    );
  }, [builtinManifests, search]);

  // Filter installed
  const filteredInstalled = useMemo(() => {
    if (!search.trim()) return plugins;
    const q = search.toLowerCase();
    return plugins.filter(p =>
      p.manifest.name.toLowerCase().includes(q) ||
      p.manifest.description.toLowerCase().includes(q)
    );
  }, [plugins, search]);

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
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="3"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{"\uD50C\uB7EC\uADF8\uC778 \uAD00\uB9AC\uC790"}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.accent,
            background: `${T.accent}15`, padding: "2px 7px", borderRadius: 8,
          }}>{plugins.length}</span>
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        {([
          { id: "marketplace" as ViewMode, label: "\uB9C8\uCF13\uD50C\uB808\uC774\uC2A4" },
          { id: "installed" as ViewMode, label: `\uC124\uCE58\uB428 (${plugins.length})` },
        ]).map(tab => (
          <button key={tab.id} onClick={() => { setView(tab.id); setSelectedPlugin(null); setSelectedInstalled(null); }}
            style={{
              flex: 1, padding: "8px 0", border: "none",
              borderBottom: `2px solid ${view === tab.id ? T.accent : "transparent"}`,
              background: "none", color: view === tab.id ? T.accent : T.muted,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={"\uD50C\uB7EC\uADF8\uC778 \uAC80\uC0C9..."}
          style={{
            width: "100%", padding: "8px 10px", background: "#f3f4f6",
            border: `1px solid ${T.border}`, borderRadius: 8, color: T.text,
            fontSize: 12, outline: "none", fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
          onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            {"\uB85C\uB529 \uC911..."}
          </div>
        ) : (
          <>
            {/* ── Detail View (Marketplace Plugin) ──────────────────────────────── */}
            {view === "marketplace" && selectedPlugin && (
              <div style={{
                padding: "14px", borderRadius: 10,
                background: `${T.accent}06`, border: `1px solid ${T.borderHi || T.border}`,
              }}>
                <button onClick={() => setSelectedPlugin(null)}
                  style={{
                    background: "none", border: "none", color: T.muted, cursor: "pointer",
                    fontSize: 11, padding: 0, marginBottom: 8, fontFamily: "inherit",
                  }}>&larr; {"\uBAA9\uB85D\uC73C\uB85C"}</button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{selectedPlugin.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedPlugin.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{selectedPlugin.author} · v{selectedPlugin.version}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 12 }}>
                  {selectedPlugin.description}
                </div>

                {/* Capabilities */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {"\uAE30\uB2A5"}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {selectedPlugin.capabilities.map(cap => (
                      <span key={cap} style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 4,
                        background: `${CAPABILITY_COLORS[cap]}15`,
                        color: CAPABILITY_COLORS[cap],
                        border: `1px solid ${CAPABILITY_COLORS[cap]}30`,
                        fontWeight: 600,
                      }}>{CAPABILITY_LABELS[cap]}</span>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {"\uAD8C\uD55C"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {selectedPlugin.permissions.map(perm => (
                      <div key={perm} style={{
                        fontSize: 10, color: T.text, padding: "3px 8px",
                        background: "#f3f4f6", borderRadius: 4,
                        fontFamily: '"JetBrains Mono",monospace',
                      }}>
                        {perm}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isInstalled(selectedPlugin.id)) {
                      handleUninstall(selectedPlugin.id);
                    } else {
                      handleInstall(selectedPlugin);
                    }
                  }}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                    background: isInstalled(selectedPlugin.id)
                      ? "#ef4444"
                      : `linear-gradient(135deg, ${T.accent}, ${T.accentB || T.accent})`,
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: isInstalled(selectedPlugin.id)
                      ? "0 2px 14px rgba(239,68,68,0.25)"
                      : "0 2px 14px rgba(249,115,22,0.25)",
                  }}>
                  {isInstalled(selectedPlugin.id) ? "\uC81C\uAC70" : "\uC124\uCE58\uD558\uAE30"}
                </button>
              </div>
            )}

            {/* ── Marketplace Grid ──────────────────────────────────────────────── */}
            {view === "marketplace" && !selectedPlugin && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))",
                gap: 10,
              }}>
                {filteredMarketplace.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
                    {"\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
                  </div>
                ) : filteredMarketplace.map(manifest => (
                  <div key={manifest.id}
                    onClick={() => setSelectedPlugin(manifest)}
                    style={{
                      padding: "14px", borderRadius: 10,
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{manifest.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {manifest.name}
                        </div>
                        <div style={{ fontSize: 9, color: T.muted }}>{manifest.author}</div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 10, color: T.muted, lineHeight: 1.5, marginBottom: 8,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {manifest.description}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {manifest.capabilities.slice(0, 2).map(cap => (
                          <span key={cap} style={{
                            fontSize: 8, padding: "1px 5px", borderRadius: 3,
                            background: `${CAPABILITY_COLORS[cap]}15`,
                            color: CAPABILITY_COLORS[cap], fontWeight: 600,
                          }}>{CAPABILITY_LABELS[cap]}</span>
                        ))}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleInstall(manifest); }}
                        disabled={isInstalled(manifest.id)}
                        style={{
                          padding: "3px 8px", borderRadius: 5,
                          border: `1px solid ${isInstalled(manifest.id) ? T.border : T.accent}`,
                          background: isInstalled(manifest.id) ? "#f3f4f6" : `${T.accent}10`,
                          color: isInstalled(manifest.id) ? T.muted : T.accent,
                          fontSize: 9, fontWeight: 700, cursor: isInstalled(manifest.id) ? "default" : "pointer",
                          fontFamily: "inherit", opacity: isInstalled(manifest.id) ? 0.6 : 1,
                        }}>
                        {isInstalled(manifest.id) ? "\uC124\uCE58\uB428" : "\uC124\uCE58"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Detail View (Installed Plugin) ────────────────────────────────── */}
            {view === "installed" && selectedInstalled && (
              <div style={{
                padding: "14px", borderRadius: 10,
                background: `${T.accent}06`, border: `1px solid ${T.borderHi || T.border}`,
              }}>
                <button onClick={() => setSelectedInstalled(null)}
                  style={{
                    background: "none", border: "none", color: T.muted, cursor: "pointer",
                    fontSize: 11, padding: 0, marginBottom: 8, fontFamily: "inherit",
                  }}>&larr; {"\uBAA9\uB85D\uC73C\uB85C"}</button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{selectedInstalled.manifest.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{selectedInstalled.manifest.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {selectedInstalled.manifest.author} · v{selectedInstalled.manifest.version}
                    </div>
                  </div>
                  <span style={{
                    marginLeft: "auto", fontSize: 9, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 6,
                    background: selectedInstalled.state === "active" ? "#10b98115" : selectedInstalled.state === "error" ? "#ef444415" : "#6b728015",
                    color: selectedInstalled.state === "active" ? "#10b981" : selectedInstalled.state === "error" ? "#ef4444" : "#6b7280",
                  }}>
                    {selectedInstalled.state === "active" ? "\uD65C\uC131" : selectedInstalled.state === "error" ? "\uC624\uB958" : "\uBE44\uD65C\uC131"}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, marginBottom: 12 }}>
                  {selectedInstalled.manifest.description}
                </div>

                <div style={{ fontSize: 10, color: T.muted, marginBottom: 12 }}>
                  {"\uC124\uCE58\uC77C"}: {new Date(selectedInstalled.installedAt).toLocaleDateString("ko-KR")}
                </div>

                {/* Capabilities */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {"\uAE30\uB2A5"}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {selectedInstalled.manifest.capabilities.map(cap => (
                      <span key={cap} style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 4,
                        background: `${CAPABILITY_COLORS[cap]}15`,
                        color: CAPABILITY_COLORS[cap],
                        border: `1px solid ${CAPABILITY_COLORS[cap]}30`,
                        fontWeight: 600,
                      }}>{CAPABILITY_LABELS[cap]}</span>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {"\uAD8C\uD55C"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {selectedInstalled.manifest.permissions.map(perm => (
                      <div key={perm} style={{
                        fontSize: 10, color: T.text, padding: "3px 8px",
                        background: "#f3f4f6", borderRadius: 4,
                        fontFamily: '"JetBrains Mono",monospace',
                      }}>
                        {perm}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleToggleActive(selectedInstalled.manifest.id, selectedInstalled.state)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: `1px solid ${selectedInstalled.state === "active" ? "#f59e0b" : "#10b981"}`,
                      background: selectedInstalled.state === "active" ? "#f59e0b10" : "#10b98110",
                      color: selectedInstalled.state === "active" ? "#f59e0b" : "#10b981",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {selectedInstalled.state === "active" ? "\uBE44\uD65C\uC131\uD654" : "\uD65C\uC131\uD654"}
                  </button>
                  <button
                    onClick={() => handleUninstall(selectedInstalled.manifest.id)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: "1px solid #ef4444",
                      background: "#ef444410",
                      color: "#ef4444",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {"\uC81C\uAC70"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Installed List ─────────────────────────────────────────────────── */}
            {view === "installed" && !selectedInstalled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {filteredInstalled.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
                    {"\uC124\uCE58\uB41C \uD50C\uB7EC\uADF8\uC778\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
                    <br />
                    <button onClick={() => setView("marketplace")}
                      style={{
                        marginTop: 10, padding: "6px 14px", borderRadius: 6,
                        border: `1px solid ${T.accent}`, background: `${T.accent}10`,
                        color: T.accent, fontSize: 11, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      {"\uB9C8\uCF13\uD50C\uB808\uC774\uC2A4 \uBCF4\uAE30"}
                    </button>
                  </div>
                ) : filteredInstalled.map(plugin => (
                  <div key={plugin.manifest.id}
                    onClick={() => setSelectedInstalled(plugin)}
                    style={{
                      padding: "10px 12px", borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: "#f9fafb",
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(249,115,22,0.08)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = T.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{plugin.manifest.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{plugin.manifest.name}</div>
                      <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{plugin.manifest.author} · v{plugin.manifest.version}</div>
                    </div>
                    <span style={{
                      fontSize: 8, fontWeight: 700,
                      padding: "2px 6px", borderRadius: 4,
                      background: plugin.state === "active" ? "#10b98115" : plugin.state === "error" ? "#ef444415" : "#6b728015",
                      color: plugin.state === "active" ? "#10b981" : plugin.state === "error" ? "#ef4444" : "#6b7280",
                    }}>
                      {plugin.state === "active" ? "\uD65C\uC131" : plugin.state === "error" ? "\uC624\uB958" : "\uBE44\uD65C\uC131"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(plugin.manifest.id, plugin.state);
                      }}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: `1px solid ${T.border}`, background: "#fff",
                        color: T.muted, cursor: "pointer", fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title={plugin.state === "active" ? "\uBE44\uD65C\uC131\uD654" : "\uD65C\uC131\uD654"}
                    >
                      {plugin.state === "active" ? "\u23F8" : "\u25B6"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUninstall(plugin.manifest.id);
                      }}
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        border: "1px solid #ef444440", background: "#fff",
                        color: "#ef4444", cursor: "pointer", fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      title={"\uC81C\uAC70"}
                    >
                      {"\u2715"}
                    </button>
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
