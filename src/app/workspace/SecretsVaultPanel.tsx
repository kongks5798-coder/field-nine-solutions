"use client";

import React, { useState, useCallback, useEffect } from "react";
import { T } from "./workspace.constants";
import { useUiStore, useEnvStore } from "./stores";

// ── Types ──────────────────────────────────────────────────────────────────────

type VaultEntry = { key: string; encryptedValue: string; createdAt: string; updatedAt: string; masked: boolean };
type VaultConfig = { entries: VaultEntry[]; masterKeyHash: string; version: number };

export interface SecretsVaultPanelProps {
  onClose: () => void;
}

export function SecretsVaultPanel({ onClose }: SecretsVaultPanelProps) {
  const showToast = useUiStore(s => s.showToast);
  const setEnvVars = useEnvStore(s => s.setEnvVars);

  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [vault, setVault] = useState<VaultConfig | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if vault exists
  useEffect(() => {
    import("./ai/secretsVault").then(mod => {
      setVaultInitialized(mod.isVaultInitialized());
    }).catch(() => { /* noop */ });
  }, []);

  const handleInit = useCallback(async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const mod = await import("./ai/secretsVault");
      const v = await mod.initVault(password);
      const result = await mod.unlockVault(password);
      if (result) {
        setVault(result.vault);
        setCryptoKey(result.key);
        setUnlocked(true);
        setVaultInitialized(true);
        showToast("Vault 생성 및 잠금 해제됨");
      }
    } catch (err) {
      showToast(`Vault 초기화 실패: ${String(err)}`);
    } finally {
      setLoading(false);
      setPassword("");
    }
  }, [password, showToast]);

  const handleUnlock = useCallback(async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const mod = await import("./ai/secretsVault");
      const result = await mod.unlockVault(password);
      if (result) {
        setVault(result.vault);
        setCryptoKey(result.key);
        const allSecrets = await mod.getAllSecrets(result.vault, result.key);
        setSecrets(allSecrets);
        setUnlocked(true);
        showToast("Vault 잠금 해제됨");
      } else {
        showToast("비밀번호가 올바르지 않습니다");
      }
    } catch (err) {
      showToast(`잠금 해제 실패: ${String(err)}`);
    } finally {
      setLoading(false);
      setPassword("");
    }
  }, [password, showToast]);

  const handleAddSecret = useCallback(async () => {
    if (!newKey.trim() || !newValue.trim() || !vault || !cryptoKey) return;
    setLoading(true);
    try {
      const mod = await import("./ai/secretsVault");
      const updated = await mod.addSecret(vault, cryptoKey, newKey.trim(), newValue.trim());
      setVault(updated);
      const allSecrets = await mod.getAllSecrets(updated, cryptoKey);
      setSecrets(allSecrets);
      setNewKey("");
      setNewValue("");
      showToast(`"${newKey.trim()}" 추가됨`);
    } catch (err) {
      showToast(`추가 실패: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [newKey, newValue, vault, cryptoKey, showToast]);

  const handleRemoveSecret = useCallback(async (key: string) => {
    if (!vault) return;
    try {
      const mod = await import("./ai/secretsVault");
      const updated = await mod.removeSecret(vault, key);
      setVault(updated);
      if (cryptoKey) {
        const allSecrets = await mod.getAllSecrets(updated, cryptoKey);
        setSecrets(allSecrets);
      }
      showToast(`"${key}" 삭제됨`);
    } catch (err) {
      showToast(`삭제 실패: ${String(err)}`);
    }
  }, [vault, cryptoKey, showToast]);

  const handleExportToEnv = useCallback(async () => {
    if (!vault || !cryptoKey) return;
    try {
      const mod = await import("./ai/secretsVault");
      const envMap = await mod.exportToEnvVars(vault, cryptoKey);
      setEnvVars(envMap);
      showToast(`${Object.keys(envMap).length}개 비밀을 환경변수로 내보냈습니다`);
    } catch (err) {
      showToast(`내보내기 실패: ${String(err)}`);
    }
  }, [vault, cryptoKey, setEnvVars, showToast]);

  const handleLock = () => {
    setUnlocked(false);
    setCryptoKey(null);
    setSecrets({});
    setVisibleKeys({});
    showToast("Vault 잠금됨");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", background: "#f3f4f6",
    border: `1px solid ${T.border}`, borderRadius: 6, color: T.text,
    fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 380, maxWidth: "100%",
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
          <span style={{ fontSize: 14 }}>{"\uD83D\uDD12"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Secrets Vault</span>
          {unlocked && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.green,
              background: `${T.green}15`, padding: "2px 7px", borderRadius: 8,
            }}>잠금 해제됨</span>
          )}
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>

        {/* Not initialized — setup */}
        {!vaultInitialized && !unlocked && (
          <div>
            <div style={{
              padding: "14px", borderRadius: 10, marginBottom: 14,
              background: `${T.accent}06`, border: `1px solid ${T.borderHi}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{"\uD83D\uDD10"}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                Secrets Vault 설정
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
                마스터 비밀번호를 설정하여 환경변수를<br />AES-256으로 암호화합니다.
              </div>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleInit(); }}
              placeholder="마스터 비밀번호 설정"
              style={{ ...inputStyle, marginBottom: 10 }}
              onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
            />
            <button onClick={handleInit} disabled={!password.trim() || loading}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                background: password.trim() && !loading ? `linear-gradient(135deg, ${T.accent}, ${T.accentB})` : "#e5e7eb",
                color: password.trim() && !loading ? "#fff" : T.muted,
                fontSize: 12, fontWeight: 700, cursor: password.trim() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}>
              {loading ? "초기화 중..." : "Vault 생성"}
            </button>
          </div>
        )}

        {/* Initialized but locked */}
        {vaultInitialized && !unlocked && (
          <div>
            <div style={{
              padding: "14px", borderRadius: 10, marginBottom: 14,
              background: "#f9fafb", border: `1px solid ${T.border}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{"\uD83D\uDD12"}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                Vault 잠금됨
              </div>
              <div style={{ fontSize: 11, color: T.muted }}>
                마스터 비밀번호를 입력하세요
              </div>
            </div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleUnlock(); }}
              placeholder="마스터 비밀번호"
              autoFocus
              style={{ ...inputStyle, marginBottom: 10 }}
              onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
            />
            <button onClick={handleUnlock} disabled={!password.trim() || loading}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                background: password.trim() && !loading ? T.accent : "#e5e7eb",
                color: password.trim() && !loading ? "#fff" : T.muted,
                fontSize: 12, fontWeight: 700, cursor: password.trim() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}>
              {loading ? "잠금 해제 중..." : "잠금 해제"}
            </button>
          </div>
        )}

        {/* Unlocked */}
        {unlocked && (
          <>
            {/* Add secret form */}
            <div style={{
              padding: "10px 12px", borderRadius: 8, marginBottom: 14,
              background: "#f9fafb", border: `1px solid ${T.border}`,
            }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={newKey} onChange={e => setNewKey(e.target.value.toUpperCase())}
                  placeholder="SECRET_KEY" style={{ ...inputStyle, flex: 1, fontWeight: 600 }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
                <input value={newValue} onChange={e => setNewValue(e.target.value)}
                  type="password" placeholder="secret value"
                  style={{ ...inputStyle, flex: 1.5 }}
                  onKeyDown={e => { if (e.key === "Enter") handleAddSecret(); }}
                  onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <button onClick={handleAddSecret} disabled={!newKey.trim() || !newValue.trim() || loading}
                style={{
                  width: "100%", padding: "7px 0", borderRadius: 6,
                  border: `1px dashed ${newKey.trim() && newValue.trim() ? T.accent : T.border}`,
                  background: "transparent",
                  color: newKey.trim() && newValue.trim() ? T.accent : T.muted,
                  fontSize: 11, fontWeight: 700, cursor: newKey.trim() && newValue.trim() ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                }}>+ 시크릿 추가</button>
            </div>

            {/* Secrets list */}
            {Object.keys(secrets).length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
                저장된 시크릿이 없습니다.<br />위에서 추가하세요.
              </div>
            ) : (
              Object.entries(secrets).map(([key, value]) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", marginBottom: 4, borderRadius: 6,
                  background: "#f9fafb", border: `1px solid ${T.border}`,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: T.accent,
                    fontFamily: '"JetBrains Mono",monospace',
                    minWidth: 80, overflow: "hidden", textOverflow: "ellipsis",
                  }}>{key}</span>
                  <span style={{
                    flex: 1, fontSize: 11, color: T.text,
                    fontFamily: '"JetBrains Mono",monospace',
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {visibleKeys[key] ? value : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  </span>
                  <button onClick={() => setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{
                      background: "none", border: "none", color: T.muted, cursor: "pointer",
                      fontSize: 11, padding: "2px 4px",
                    }}>
                    {visibleKeys[key] ? "\uD83D\uDC41" : "\u25CF\u25CF"}
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(value);
                    showToast(`"${key}" 복사됨`);
                  }}
                    style={{
                      background: "none", border: "none", color: T.muted, cursor: "pointer",
                      fontSize: 11, padding: "2px 4px",
                    }}
                    title="복사"
                  >{"\uD83D\uDCCB"}</button>
                  <button onClick={() => handleRemoveSecret(key)}
                    style={{
                      background: "none", border: "none", color: T.muted, cursor: "pointer",
                      fontSize: 12, padding: "2px 4px",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.red; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
                  >{"\u2715"}</button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {unlocked && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", gap: 6 }}>
          <button onClick={handleExportToEnv}
            style={{
              flex: 1, padding: "7px 0", borderRadius: 6,
              border: `1px solid ${T.border}`, background: "#f3f4f6",
              color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>환경변수로 내보내기</button>
          <button onClick={handleLock}
            style={{
              padding: "7px 14px", borderRadius: 6,
              border: `1px solid ${T.border}`, background: "#f3f4f6",
              color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>잠금</button>
        </div>
      )}

      {/* Info */}
      <div style={{
        padding: "8px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0,
        fontSize: 9, color: T.muted, textAlign: "center", lineHeight: 1.5,
      }}>
        AES-256-GCM + PBKDF2 100K iterations · 브라우저 Web Crypto API 사용
      </div>
    </div>
  );
}
