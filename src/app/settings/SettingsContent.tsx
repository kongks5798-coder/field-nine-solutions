"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

const AI_PROVIDERS = [
  {
    id: "OPENAI_API_KEY",
    label: "OpenAI",
    model: "GPT-3.5 / GPT-4o",
    hint: "sk-...",
    icon: "🤖",
    color: "#10a37f",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "ANTHROPIC_API_KEY",
    label: "Anthropic Claude",
    model: "Claude 3.5 Sonnet / Haiku",
    hint: "sk-ant-...",
    icon: "🟣",
    color: "#7c3aed",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "GOOGLE_GENERATIVE_AI_API_KEY",
    label: "Google Gemini",
    model: "Gemini 1.5 Flash / Pro",
    hint: "AIza...",
    icon: "✨",
    color: "#4285f4",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "XAI_API_KEY",
    label: "xAI Grok",
    model: "Grok 3",
    hint: "xai-...",
    icon: "⚡",
    color: "#111827",
    docsUrl: "https://console.x.ai",
  },
];

type Tab = "api" | "account" | "notifications" | "referral";

export default function SettingsContent() {
  const [tab, setTab] = useState<Tab>("api");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    const stored: Record<string, string> = {};
    AI_PROVIDERS.forEach(p => {
      stored[p.id] = localStorage.getItem(p.id) || "";
    });
    setKeys(stored);

    // Load notification preferences from localStorage
    try {
      const notifPrefs = localStorage.getItem("f9_notification_prefs");
      if (notifPrefs) {
        const parsed = JSON.parse(notifPrefs) as { email?: boolean; browser?: boolean };
        if (typeof parsed.email === "boolean") setNotifEmail(parsed.email);
        if (typeof parsed.browser === "boolean") setNotifBrowser(parsed.browser);
      }
    } catch { /* skip */ }
  }, []);

  const handleSave = () => {
    AI_PROVIDERS.forEach(p => {
      if (keys[p.id]) localStorage.setItem(p.id, keys[p.id]);
      else localStorage.removeItem(p.id);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const configuredCount = AI_PROVIDERS.filter(p => !!keys[p.id]).length;

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "api", label: "AI API 키", icon: "🔑" },
    { id: "account", label: "계정 설정", icon: "👤" },
    { id: "notifications", label: "알림", icon: "🔔" },
    { id: "referral", label: "친구 초대", icon: "🎁" },
  ];

  return (
    <AppShell>
      <div style={{
        minHeight: "calc(100vh - 56px)", background: "#f9fafb",
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1b1b1f", marginBottom: 4 }}>
              설정
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              AI 키, 계정, 알림 등 서비스 설정을 관리합니다.
            </p>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="설정 탭" style={{
            display: "flex", gap: 4, marginBottom: 24,
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 10, padding: 4,
          }}>
            {TABS.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: tab === t.id ? "#f97316" : "transparent",
                color: tab === t.id ? "#fff" : "#6b7280",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: API Keys ─────────────────────────────────── */}
          {tab === "api" && (
            <div>
              {/* Status bar */}
              <div style={{
                padding: "12px 16px", borderRadius: 10, marginBottom: 20,
                background: configuredCount > 0 ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${configuredCount > 0 ? "#bbf7d0" : "#fed7aa"}`,
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: configuredCount > 0 ? "#166534" : "#92400e",
              }}>
                <span style={{ fontSize: 18 }}>{configuredCount > 0 ? "✅" : "⚠️"}</span>
                <span>
                  {configuredCount > 0
                    ? `${configuredCount}개의 AI 키가 설정되어 있습니다. AI 기능을 사용할 수 있습니다.`
                    : "AI API 키가 없습니다. 아래에서 키를 추가해 AI 기능을 활성화하세요."}
                </span>
              </div>

              {/* Provider cards */}
              {AI_PROVIDERS.map(p => (
                <div key={p.id} style={{
                  background: "#fff", border: "1.5px solid",
                  borderColor: keys[p.id] ? "#bbf7d0" : "#e5e7eb",
                  borderRadius: 12, padding: 20, marginBottom: 14,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1b1b1f" }}>{p.label}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{p.model}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {keys[p.id] ? (
                        <span style={{
                          padding: "3px 10px", borderRadius: 9999,
                          background: "#dcfce7", color: "#166534",
                          fontSize: 11, fontWeight: 700,
                        }}>✓ 설정됨</span>
                      ) : (
                        <span style={{
                          padding: "3px 10px", borderRadius: 9999,
                          background: "#f3f4f6", color: "#9ca3af",
                          fontSize: 11, fontWeight: 600,
                        }}>미설정</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      aria-label={`${p.label} API 키`}
                      type={show[p.id] ? "text" : "password"}
                      value={keys[p.id] || ""}
                      onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={p.hint}
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 8,
                        border: "1.5px solid #e5e7eb", fontSize: 13,
                        color: "#1b1b1f", outline: "none", background: "#f9fafb",
                        fontFamily: "monospace",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => (e.target.style.borderColor = "#f97316")}
                      onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                    />
                    <button
                      onClick={() => setShow(s => ({ ...s, [p.id]: !s[p.id] }))}
                      aria-label={show[p.id] ? `${p.label} 키 숨기기` : `${p.label} 키 보기`}
                      style={{
                        padding: "0 14px", borderRadius: 8, border: "1.5px solid #e5e7eb",
                        background: "#fff", cursor: "pointer", fontSize: 16,
                        color: "#6b7280",
                      }}
                    >
                      {show[p.id] ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>
                    키 발급:{" "}
                    <a
                      href={p.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}
                    >
                      {p.docsUrl.replace("https://", "")} →
                    </a>
                  </div>
                </div>
              ))}

              {/* Save button */}
              <button
                onClick={handleSave}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                  background: saved
                    ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                    : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(249,115,22,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {saved ? "✅ 저장 완료!" : "저장하기 →"}
              </button>

              {/* Env tip */}
              <div style={{
                marginTop: 20, padding: "14px 16px", borderRadius: 10,
                background: "#fffbeb", border: "1px solid #fde68a", fontSize: 13,
              }}>
                <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 8 }}>
                  💡 프로덕션 배포 시 권장 설정
                </div>
                <p style={{ color: "#78350f", marginBottom: 8, lineHeight: 1.6 }}>
                  보안을 위해 실제 서비스에서는 서버 환경변수를 사용하세요.
                </p>
                <pre style={{
                  background: "#1b1b1f", borderRadius: 8, padding: "10px 14px",
                  fontSize: 12, color: "#8be9fd", margin: 0, overflowX: "auto",
                }}>
{`# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...`}
                </pre>
              </div>
            </div>
          )}

          {/* ── Tab: Account ──────────────────────────────────── */}
          {tab === "account" && (
            <div>
              <AccountTab />
            </div>
          )}

          {/* ── Tab: Notifications ────────────────────────────── */}
          {tab === "notifications" && (
            <div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                {[
                  {
                    label: "이메일 알림", desc: "AI 작업 완료, 팀 초대 등을 이메일로 받습니다.",
                    value: notifEmail, set: setNotifEmail,
                  },
                  {
                    label: "브라우저 알림", desc: "팀 채팅 메시지, 공유 문서 변경을 브라우저 알림으로 받습니다.",
                    value: notifBrowser, set: setNotifBrowser,
                  },
                ].map((item, i) => (
                  <div key={item.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 20px",
                    borderBottom: i === 0 ? "1px solid #f3f4f6" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1b1b1f", marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      role="switch"
                      aria-checked={item.value}
                      aria-label={item.label}
                      style={{
                        width: 44, height: 24, borderRadius: 9999, border: "none",
                        background: item.value ? "#f97316" : "#e5e7eb",
                        position: "relative", cursor: "pointer", transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: "absolute", top: 3, left: item.value ? 23 : 3,
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <button
                onClick={() => {
                  localStorage.setItem("f9_notification_prefs", JSON.stringify({ email: notifEmail, browser: notifBrowser }));
                  setNotifSaved(true);
                  setTimeout(() => setNotifSaved(false), 2500);
                }}
                style={{
                  marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                  background: notifSaved
                    ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                    : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
                  color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(249,115,22,0.25)",
                  transition: "all 0.2s",
                }}
              >
                {notifSaved ? "✅ 알림 설정이 저장되었습니다" : "저장"}
              </button>
            </div>
          )}

          {/* ── Tab: Referral ─────────────────────────────────── */}
          {tab === "referral" && (
            <ReferralTab />
          )}

        </div>
      </div>
    </AppShell>
  );
}

// ── Referral sub-component ─────────────────────────────────────────────────────

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DALKAK-${code}`;
}

function ReferralTab() {
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [invitedCount] = useState(0);

  useEffect(() => {
    let code = localStorage.getItem("dalkak_referral_code");
    if (!code) {
      code = generateReferralCode();
      localStorage.setItem("dalkak_referral_code", code);
    }
    setReferralCode(code);
  }, []);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #fff7ed 0%, #fef2f2 50%, #f0f9ff 100%)",
        border: "1px solid #fed7aa", borderRadius: 14,
        padding: "28px 24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1b1b1f", marginBottom: 8 }}>
          친구를 초대하고 Pro 7일 무료!
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          친구가 아래 링크로 가입하면 <strong style={{ color: "#f97316" }}>양쪽 모두</strong> Pro 플랜 7일을 무료로 사용할 수 있습니다.
        </p>
      </div>

      {/* Referral code */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 10 }}>내 추천 코드</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", borderRadius: 10,
          background: "#f9fafb", border: "1.5px solid #e5e7eb",
          marginBottom: 16,
        }}>
          <span style={{
            flex: 1, fontSize: 20, fontWeight: 900, color: "#f97316",
            letterSpacing: "0.08em", fontFamily: "monospace",
          }}>
            {referralCode || "..."}
          </span>
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 10 }}>추천 링크</div>
        <div style={{
          display: "flex", gap: 8,
        }}>
          <input
            type="text"
            readOnly
            value={referralLink}
            aria-label="추천 링크"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8,
              border: "1.5px solid #e5e7eb", fontSize: 13,
              color: "#6b7280", outline: "none", background: "#f9fafb",
              fontFamily: "monospace",
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: copied
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {copied ? "✅ 복사됨!" : "링크 복사"}
          </button>
        </div>
      </div>

      {/* Invited count */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1b1b1f", marginBottom: 4 }}>초대한 친구</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>가입 완료된 친구 수</div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: invitedCount > 0 ? "linear-gradient(135deg, #f97316, #f43f5e)" : "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900,
            color: invitedCount > 0 ? "#fff" : "#9ca3af",
          }}>
            {invitedCount}
          </div>
        </div>

        {invitedCount === 0 && (
          <div style={{
            marginTop: 16, padding: "14px 16px", borderRadius: 10,
            background: "#f9fafb", border: "1px solid #f3f4f6",
            fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 1.6,
          }}>
            아직 초대한 친구가 없습니다.<br />
            링크를 공유해서 함께 Dalkak을 사용해보세요!
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1b1b1f", marginBottom: 14 }}>이용 방법</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { step: "1", text: "위의 추천 링크를 복사해서 친구에게 공유하세요." },
            { step: "2", text: "친구가 링크를 통해 Dalkak에 가입합니다." },
            { step: "3", text: "양쪽 모두 Pro 플랜 7일 무료 혜택이 자동 적용됩니다!" },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #f97316, #f43f5e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
              }}>
                {item.step}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, paddingTop: 4 }}>
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Account sub-component ──────────────────────────────────────────────────────

function AccountTab() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fn_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setName(u.name || "");
        setEmail(u.email || "");
      } catch { /* skip */ }
    }
  }, []);

  const handleSave = () => {
    const stored = localStorage.getItem("fn_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        u.name = name.trim() || u.name;
        localStorage.setItem("fn_user", JSON.stringify(u));
      } catch { /* skip */ }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarLetter = name.charAt(0).toUpperCase() || "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Avatar */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "24px 20px", display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 700, color: "#fff", flexShrink: 0,
        }}>
          {avatarLetter}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1b1b1f" }}>{name || "이름 없음"}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10 }}>{email || "이메일 없음"}</div>
          <button style={{
            padding: "6px 14px", borderRadius: 7, border: "1px solid #e5e7eb",
            background: "#f9fafb", fontSize: 12, fontWeight: 600,
            color: "#374151", cursor: "pointer",
          }}>
            아바타 변경
          </button>
        </div>
      </div>

      {/* Fields */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "이름", value: name, set: setName, placeholder: "홍길동" },
            { label: "이메일", value: email, set: setEmail, placeholder: "you@example.com", disabled: true },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>
                {f.label}
                {f.disabled && <span style={{ marginLeft: 6, fontSize: 11, color: "#d1d5db" }}>(변경 불가)</span>}
              </label>
              <input
                type="text"
                aria-label={f.label}
                value={f.value}
                onChange={e => !f.disabled && f.set(e.target.value)}
                placeholder={f.placeholder}
                disabled={f.disabled}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "1.5px solid #e5e7eb", fontSize: 14, color: f.disabled ? "#9ca3af" : "#1b1b1f",
                  outline: "none", background: f.disabled ? "#f9fafb" : "#fff",
                  boxSizing: "border-box", cursor: f.disabled ? "not-allowed" : "text",
                }}
                onFocus={e => { if (!f.disabled) e.target.style.borderColor = "#f97316"; }}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
            background: saved
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: "0 4px 14px rgba(249,115,22,0.2)",
            transition: "all 0.2s",
          }}
        >
          {saved ? "✅ 저장 완료!" : "변경사항 저장 →"}
        </button>
      </div>

      {/* Danger zone */}
      <div style={{
        background: "#fff", border: "1px solid #fecaca", borderRadius: 12,
        padding: "20px",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>위험 구역</div>
        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
          계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: "8px 18px", borderRadius: 7, border: "1px solid #fecaca",
              background: "#fff", fontSize: 13, fontWeight: 600,
              color: "#dc2626", cursor: "pointer",
            }}
          >
            계정 삭제
          </button>
        ) : (
          <div style={{
            padding: "14px 16px", borderRadius: 10,
            background: "#fef2f2", border: "1px solid #fecaca",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#991b1b", marginBottom: 12 }}>
              정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 데이터가 영구적으로 삭제됩니다.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  alert("계정 삭제 기능은 준비 중입니다. sales@fieldnine.io로 문의해주세요.");
                }}
                style={{
                  padding: "8px 18px", borderRadius: 7, border: "none",
                  background: "#dc2626", fontSize: 13, fontWeight: 600,
                  color: "#fff", cursor: "pointer",
                }}
              >
                삭제 확인
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "8px 18px", borderRadius: 7, border: "1px solid #e5e7eb",
                  background: "#f3f4f6", fontSize: 13, fontWeight: 600,
                  color: "#6b7280", cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
