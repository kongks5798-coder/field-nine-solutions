"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

// ─── AI Provider definitions ──────────────────────────────────────────────────

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
    id: "GROQ_API_KEY",
    label: "Groq",
    model: "Llama 3.3 70B / Mixtral",
    hint: "gsk_...",
    icon: "⚡",
    color: "#f59e0b",
    docsUrl: "https://console.groq.com/keys",
  },
  {
    id: "XAI_API_KEY",
    label: "xAI Grok",
    model: "Grok 3",
    hint: "xai-...",
    icon: "🌌",
    color: "#6366f1",
    docsUrl: "https://console.x.ai",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "general" | "ai" | "api" | "notifications" | "privacy";

interface GeneralPrefs {
  language: "ko" | "en";
  emailAlerts: boolean;
  autoSave: "1" | "5" | "10";
}

interface AIPrefs {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  pipeline: "auto" | "always" | "never";
}

interface NotifPrefs {
  billing: boolean;
  usageAlerts: boolean;
  newFeatures: boolean;
  toastDuration: "3" | "5" | "8";
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${T.border}`,
  fontSize: 13, color: T.text, background: T.surface, boxSizing: "border-box",
  outline: "none", transition: "border-color 0.15s", fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 500, color: T.muted, marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "12px 0", borderRadius: 9, border: "none",
  background: T.gradient, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
  transition: "all 0.2s",
};

const btnSuccess: React.CSSProperties = {
  ...btnPrimary,
  background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 9999, border: "none",
        background: value ? T.accent : T.border,
        position: "relative", cursor: "pointer", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: T.muted }}>{desc}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

// ─── Tab: General ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const [prefs, setPrefs] = useState<GeneralPrefs>({ language: "ko", emailAlerts: true, autoSave: "5" });
  const [saved, setSaved] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem("fn_general_prefs");
      if (s) {
        const p = JSON.parse(s) as Partial<GeneralPrefs>;
        setPrefs(prev => ({ ...prev, ...p }));
      }
    } catch { /* skip */ }

    // Load username from server profile
    fetch("/api/user/profile")
      .then(r => r.ok ? r.json() : null)
      .then((d: { user?: { username?: string } } | null) => {
        if (d?.user?.username) setUsername(d.user.username);
      })
      .catch(() => {});
  }, []);

  const handleSave = () => {
    localStorage.setItem("fn_general_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveUsername = async () => {
    setUsernameError("");
    const trimmed = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameError("영문 소문자·숫자·밑줄(_)만 3~20자로 입력해주세요.");
      return;
    }
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setUsernameError(json.error ?? "저장 실패"); return; }
      setUsername(trimmed);
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 2500);
    } catch { setUsernameError("네트워크 오류가 발생했습니다."); }
  };

  const set = <K extends keyof GeneralPrefs>(key: K, val: GeneralPrefs[K]) => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 16px" }}>테마</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {(["dark", "light", "system"] as const).map(t => (
            <button key={t} disabled={t !== "dark"} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${t === "dark" ? T.accent : T.border}`,
              background: t === "dark" ? `${T.accent}18` : "transparent",
              color: t === "dark" ? T.accent : T.muted, fontSize: 13, fontWeight: 600,
              cursor: t === "dark" ? "default" : "not-allowed", opacity: t !== "dark" ? 0.4 : 1,
            }}>
              {t === "dark" ? "다크" : t === "light" ? "라이트" : "시스템"}
              {t !== "dark" && <span style={{ display: "block", fontSize: 10, marginTop: 2 }}>(준비중)</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 16px" }}>언어</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {(["ko", "en"] as const).map(lang => (
            <button key={lang} onClick={() => set("language", lang)} style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: `1.5px solid ${prefs.language === lang ? T.accent : T.border}`,
              background: prefs.language === lang ? `${T.accent}18` : "transparent",
              color: prefs.language === lang ? T.accent : T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {lang === "ko" ? "한국어" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>이메일 알림</h3>
        <ToggleRow
          label="이메일 알림 수신"
          desc="AI 작업 완료, 청구 안내 등을 이메일로 받습니다."
          value={prefs.emailAlerts}
          onChange={v => set("emailAlerts", v)}
        />
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 16px" }}>자동 저장 간격</h3>
        <select value={prefs.autoSave} onChange={e => set("autoSave", e.target.value as "1" | "5" | "10")}
          style={selectStyle} aria-label="자동 저장 간격">
          <option value="1">1초마다</option>
          <option value="5">5초마다</option>
          <option value="10">10초마다</option>
        </select>
      </div>

      {/* ── Username ──────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>사용자명</h3>
        <p style={{ fontSize: 12, color: T.muted, margin: "0 0 14px" }}>
          공개 프로필 URL:{" "}
          <a
            href={username ? `/u/${username}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.accent, textDecoration: "none" }}
          >
            fieldnine.io/u/{username || "사용자명"}
          </a>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            aria-label="사용자명"
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameError(""); }}
            placeholder="예: johndoe (3~20자, 영문·숫자·_)"
            maxLength={20}
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => { e.target.style.borderColor = T.accent; }}
            onBlur={e => { e.target.style.borderColor = T.border; }}
          />
          <button
            onClick={handleSaveUsername}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none", whiteSpace: "nowrap",
              background: usernameSaved ? "linear-gradient(135deg, #22c55e, #16a34a)" : T.gradient,
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            {usernameSaved ? "저장됨!" : "저장"}
          </button>
        </div>
        {usernameError && (
          <div style={{ marginTop: 8, fontSize: 12, color: T.red }}>{usernameError}</div>
        )}
      </div>

      <button onClick={handleSave} style={saved ? btnSuccess : btnPrimary}>
        {saved ? "저장 완료!" : "설정 저장"}
      </button>
    </div>
  );
}

// ─── Tab: AI Settings ────────────────────────────────────────────────────────

function AISettingsTab() {
  const [prefs, setPrefs] = useState<AIPrefs>({
    defaultModel: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4096,
    pipeline: "auto",
  });
  const [saved, setSaved] = useState(false);
  const [specEditor, setSpecEditor] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("fn_ai_prefs");
      if (s) {
        const p = JSON.parse(s) as Partial<AIPrefs>;
        setPrefs(prev => ({ ...prev, ...p }));
      }
    } catch { /* skip */ }
    setSpecEditor(localStorage.getItem("dalkak_spec_editor") === "true");
  }, []);

  const handleSave = () => {
    localStorage.setItem("fn_ai_prefs", JSON.stringify(prefs));
    localStorage.setItem("dalkak_spec_editor", specEditor ? "true" : "false");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = <K extends keyof AIPrefs>(key: K, val: AIPrefs[K]) => setPrefs(p => ({ ...p, [key]: val }));

  const tempLabel = prefs.temperature < 0.3 ? "보수적 (정확)" : prefs.temperature < 0.7 ? "균형" : prefs.temperature < 0.9 ? "창의적" : "매우 창의적";

  return (
    <div>
      <div style={cardStyle}>
        <label style={labelStyle}>기본 AI 모델</label>
        <select value={prefs.defaultModel} onChange={e => set("defaultModel", e.target.value)}
          style={selectStyle} aria-label="기본 AI 모델">
          <option value="gpt-4o">OpenAI GPT-4o</option>
          <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
          <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
          <option value="claude-3-haiku">Anthropic Claude 3 Haiku</option>
          <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
          <option value="llama-3.3-70b">Groq Llama 3.3 70B</option>
        </select>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>
          Temperature <span style={{ color: T.text, fontWeight: 700 }}>{prefs.temperature.toFixed(1)}</span>
          <span style={{ marginLeft: 8, color: T.accent }}>{tempLabel}</span>
        </label>
        <input type="range" min="0" max="1" step="0.1"
          value={prefs.temperature}
          onChange={e => set("temperature", parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: T.accent }}
          aria-label="Temperature"
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginTop: 4 }}>
          <span>0 — 정확</span><span>1 — 창의적</span>
        </div>
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>최대 토큰 수</label>
        <select value={prefs.maxTokens} onChange={e => set("maxTokens", parseInt(e.target.value))}
          style={selectStyle} aria-label="최대 토큰 수">
          <option value={1024}>1,024 토큰 (짧은 응답)</option>
          <option value={2048}>2,048 토큰</option>
          <option value={4096}>4,096 토큰 (기본)</option>
          <option value={8192}>8,192 토큰</option>
          <option value={16384}>16,384 토큰 (긴 응답)</option>
        </select>
      </div>

      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <label style={labelStyle}>커머셜 파이프라인</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["auto", "always", "never"] as const).map(v => (
            <button key={v} onClick={() => set("pipeline", v)} style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${prefs.pipeline === v ? T.accent : T.border}`,
              background: prefs.pipeline === v ? `${T.accent}18` : "transparent",
              color: prefs.pipeline === v ? T.accent : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {v === "auto" ? "자동" : v === "always" ? "항상" : "안 함"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
          자동: 필요시만 사용 · 항상: 모든 요청에 사용 · 안 함: 비활성화
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 20, padding: "0 20px" }}>
        <ToggleRow
          label="Architect 스펙 에디터"
          desc="생성 전 AI 설계 스펙을 검토하고 수정합니다"
          value={specEditor}
          onChange={v => setSpecEditor(v)}
        />
      </div>

      <button onClick={handleSave} style={saved ? btnSuccess : btnPrimary}>
        {saved ? "저장 완료!" : "AI 설정 저장"}
      </button>
    </div>
  );
}

// ─── Tab: API Keys ────────────────────────────────────────────────────────────

function APIKeysTab() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail" | null>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored: Record<string, string> = {};
    AI_PROVIDERS.forEach(p => { stored[p.id] = localStorage.getItem(p.id) || ""; });
    setKeys(stored);
  }, []);

  const handleSave = () => {
    AI_PROVIDERS.forEach(p => {
      if (keys[p.id]) localStorage.setItem(p.id, keys[p.id]);
      else localStorage.removeItem(p.id);
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async (providerId: string) => {
    setTesting(t => ({ ...t, [providerId]: true }));
    setTestResult(r => ({ ...r, [providerId]: null }));
    // Quick format validation (actual API test would need a server route)
    await new Promise(r => setTimeout(r, 800));
    const key = keys[providerId] || "";
    const valid = providerId === "OPENAI_API_KEY" ? key.startsWith("sk-")
      : providerId === "ANTHROPIC_API_KEY" ? key.startsWith("sk-ant-")
      : providerId === "GOOGLE_GENERATIVE_AI_API_KEY" ? key.startsWith("AIza")
      : providerId === "GROQ_API_KEY" ? key.startsWith("gsk_")
      : key.length > 10;
    setTestResult(r => ({ ...r, [providerId]: valid ? "ok" : "fail" }));
    setTesting(t => ({ ...t, [providerId]: false }));
  };

  const configuredCount = AI_PROVIDERS.filter(p => !!keys[p.id]).length;

  return (
    <div>
      {/* Warning banner */}
      <div style={{
        padding: "12px 16px", borderRadius: 10, marginBottom: 16,
        background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)",
        fontSize: 13, color: T.yellow, lineHeight: 1.5,
      }}>
        API 키는 브라우저에만 저장됩니다. 서버로 전송되지 않습니다.
      </div>

      {/* Status */}
      <div style={{
        padding: "12px 16px", borderRadius: 10, marginBottom: 20,
        background: configuredCount > 0 ? "rgba(34,197,94,0.08)" : "rgba(249,115,22,0.08)",
        border: `1px solid ${configuredCount > 0 ? "rgba(34,197,94,0.25)" : "rgba(249,115,22,0.25)"}`,
        display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        color: configuredCount > 0 ? T.green : T.accent,
      }}>
        <span>{configuredCount > 0 ? "✅" : "⚠️"}</span>
        <span>
          {configuredCount > 0
            ? `${configuredCount}개의 AI 키가 설정되어 있습니다.`
            : "AI API 키가 없습니다. 아래에서 키를 추가해 AI 기능을 활성화하세요."}
        </span>
      </div>

      {AI_PROVIDERS.map(p => (
        <div key={p.id} style={{
          ...cardStyle,
          borderColor: keys[p.id] ? "rgba(34,197,94,0.3)" : T.border,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{p.label}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.model}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {testResult[p.id] === "ok" && <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>✓ 유효</span>}
              {testResult[p.id] === "fail" && <span style={{ fontSize: 11, fontWeight: 700, color: T.red }}>✗ 형식 오류</span>}
              {keys[p.id] ? (
                <span style={{ padding: "3px 10px", borderRadius: 9999, background: "rgba(34,197,94,0.12)", color: T.green, fontSize: 11, fontWeight: 700 }}>설정됨</span>
              ) : (
                <span style={{ padding: "3px 10px", borderRadius: 9999, background: T.surface, color: T.muted, fontSize: 11, fontWeight: 600 }}>미설정</span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              aria-label={`${p.label} API 키`}
              type={show[p.id] ? "text" : "password"}
              value={keys[p.id] || ""}
              onChange={e => setKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
              placeholder={p.hint}
              style={{ ...inputStyle, fontFamily: "monospace", flex: 1 }}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
            <button
              onClick={() => setShow(s => ({ ...s, [p.id]: !s[p.id] }))}
              aria-label={show[p.id] ? `${p.label} 키 숨기기` : `${p.label} 키 보기`}
              style={{ padding: "0 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, cursor: "pointer", fontSize: 16, color: T.muted }}
            >
              {show[p.id] ? "🙈" : "👁️"}
            </button>
            <button
              onClick={() => handleTest(p.id)}
              disabled={!keys[p.id] || testing[p.id]}
              aria-label={`${p.label} 키 테스트`}
              style={{
                padding: "0 14px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.surface, cursor: keys[p.id] && !testing[p.id] ? "pointer" : "not-allowed",
                fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap",
                opacity: (!keys[p.id] || testing[p.id]) ? 0.5 : 1,
              }}
            >
              {testing[p.id] ? "..." : "테스트"}
            </button>
          </div>

          <div style={{ fontSize: 12, color: T.muted }}>
            키 발급:{" "}
            <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>
              {p.docsUrl.replace("https://", "")} →
            </a>
          </div>
        </div>
      ))}

      <button onClick={handleSave} style={saved ? btnSuccess : btnPrimary}>
        {saved ? "저장 완료!" : "API 키 저장"}
      </button>

      <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontSize: 13 }}>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 8 }}>프로덕션 배포 시 권장 설정</div>
        <pre style={{
          background: T.bg, borderRadius: 8, padding: "10px 14px",
          fontSize: 12, color: "#8be9fd", margin: 0, overflowX: "auto",
        }}>
{`# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GROQ_API_KEY=gsk_...`}
        </pre>
      </div>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>({ billing: true, usageAlerts: true, newFeatures: false, toastDuration: "5" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("fn_notif_prefs");
      if (s) {
        const p = JSON.parse(s) as Partial<NotifPrefs>;
        setPrefs(prev => ({ ...prev, ...p }));
      }
    } catch { /* skip */ }
  }, []);

  const handleSave = () => {
    localStorage.setItem("fn_notif_prefs", JSON.stringify(prefs));
    // Also keep legacy key for compatibility
    localStorage.setItem("f9_notification_prefs", JSON.stringify({ email: prefs.billing, browser: prefs.usageAlerts }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = <K extends keyof NotifPrefs>(key: K, val: NotifPrefs[K]) => setPrefs(p => ({ ...p, [key]: val }));

  return (
    <div>
      <div style={{ ...cardStyle, padding: "0 20px" }}>
        <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          <ToggleRow label="청구 알림" desc="결제 완료, 청구서 발행 시 이메일을 받습니다." value={prefs.billing} onChange={v => set("billing", v)} />
          <ToggleRow label="사용량 경고" desc="AI 호출 한도 80% 도달 시 이메일을 받습니다." value={prefs.usageAlerts} onChange={v => set("usageAlerts", v)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>새 기능 안내</div>
              <div style={{ fontSize: 12, color: T.muted }}>Dalkak 신규 기능 출시 소식을 받습니다.</div>
            </div>
            <Toggle value={prefs.newFeatures} onChange={v => set("newFeatures", v)} />
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <label style={labelStyle}>토스트 알림 표시 시간</label>
        <select value={prefs.toastDuration} onChange={e => set("toastDuration", e.target.value as NotifPrefs["toastDuration"])}
          style={selectStyle} aria-label="토스트 표시 시간">
          <option value="3">3초</option>
          <option value="5">5초 (기본)</option>
          <option value="8">8초</option>
        </select>
      </div>

      <button onClick={handleSave} style={saved ? btnSuccess : btnPrimary}>
        {saved ? "알림 설정 저장 완료!" : "알림 설정 저장"}
      </button>
    </div>
  );
}

// ─── Tab: Privacy ─────────────────────────────────────────────────────────────

function PrivacyTab() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // GDPR Article 20 — server-side data export
  const handleExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setExportError(json.message ?? "내보내기에 실패했습니다.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      const a = document.createElement("a");
      a.href = url;
      a.download = `dalkak-data-export-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("네트워크 오류가 발생했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const json = await res.json().catch(() => ({})) as { success?: boolean; message?: string };
      if (!res.ok) {
        setDeleteError(json.message ?? "계정 삭제 중 오류가 발생했습니다.");
        setDeleting(false);
        return;
      }
      // Redirect to login page with deleted flag
      window.location.href = "/login?deleted=true";
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.");
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Legal documents */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>법적 문서</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "개인정보 처리방침", href: "/privacy" },
            { label: "이용약관", href: "/terms" },
          ].map(item => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`,
              textDecoration: "none", color: T.text, fontSize: 14, fontWeight: 500,
              transition: "border-color 0.15s",
            }}>
              {item.label}
              <span style={{ color: T.muted, fontSize: 12 }}>→</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── 계정 관리 (Danger Zone) ─────────────────────────────────── */}
      <div style={{
        ...cardStyle,
        border: "1px solid rgba(248,113,113,0.3)",
        background: "rgba(248,113,113,0.03)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.red, textTransform: "uppercase", marginBottom: 16 }}>
          계정 관리
        </div>

        {/* Data export row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 0", borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>
              📦 내 데이터 내보내기
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              GDPR 제20조 — 모든 계정 데이터를 JSON 파일로 다운로드합니다.
            </div>
            {exportError && (
              <div style={{ marginTop: 6, fontSize: 12, color: T.red }}>{exportError}</div>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: "9px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.surface, color: T.text, fontSize: 13, fontWeight: 600,
              cursor: exporting ? "not-allowed" : "pointer",
              opacity: exporting ? 0.6 : 1, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {exporting ? "준비 중..." : "JSON 다운로드"}
          </button>
        </div>

        {/* Account delete row */}
        <div style={{ paddingTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.red, marginBottom: 4 }}>
            🗑️ 계정 삭제
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>
            계정을 삭제하면 모든 데이터, 프로젝트, 구독이 영구적으로 삭제되며 복구할 수 없습니다.
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: "9px 20px", borderRadius: 8,
                border: "1px solid rgba(248,113,113,0.4)",
                background: "rgba(248,113,113,0.08)", color: T.red,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              계정 삭제
            </button>
          ) : (
            <div style={{
              padding: "16px", borderRadius: 10,
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginBottom: 10 }}>
                계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
                확인하려면 아래 입력란에 <strong style={{ color: T.text }}>DELETE</strong>를 입력하세요.
              </div>
              <input
                type="text"
                aria-label="삭제 확인 입력"
                value={deleteInput}
                onChange={e => { setDeleteInput(e.target.value); setDeleteError(""); }}
                placeholder="DELETE"
                style={{
                  ...inputStyle,
                  marginBottom: 10,
                  borderColor: deleteInput === "DELETE" ? T.red : T.border,
                  fontFamily: "monospace",
                }}
                onFocus={e => { e.target.style.borderColor = T.red; }}
                onBlur={e => { e.target.style.borderColor = deleteInput === "DELETE" ? T.red : T.border; }}
              />
              {deleteError && (
                <div style={{ marginBottom: 10, fontSize: 12, color: T.red }}>{deleteError}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteInput !== "DELETE" || deleting}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "none",
                    background: deleteInput === "DELETE" && !deleting ? "#ef4444" : "rgba(248,113,113,0.3)",
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    cursor: deleteInput === "DELETE" && !deleting ? "pointer" : "not-allowed",
                    opacity: deleteInput !== "DELETE" || deleting ? 0.6 : 1,
                    transition: "background 0.15s",
                  }}
                >
                  {deleting ? "삭제 중..." : "영구 삭제"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}
                  disabled={deleting}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.surface, fontSize: 13, fontWeight: 600,
                    color: T.muted, cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Referral sub-component (preserved) ─────────────────────────────────────

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `DALKAK-${code}`;
}

function AccountTab() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fn_user");
    if (stored) {
      try {
        const u = JSON.parse(stored) as { name?: string; email?: string };
        setName(u.name || ""); setEmail(u.email || "");
      } catch { /* skip */ }
    }
    let code = localStorage.getItem("dalkak_referral_code");
    if (!code) { code = generateReferralCode(); localStorage.setItem("dalkak_referral_code", code); }
    setReferralCode(code);
  }, []);

  const handleSave = () => {
    const stored = localStorage.getItem("fn_user");
    if (stored) {
      try {
        const u = JSON.parse(stored) as Record<string, unknown>;
        u.name = name.trim() || u.name;
        localStorage.setItem("fn_user", JSON.stringify(u));
      } catch { /* skip */ }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const referralLink = typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const avatarLetter = name.charAt(0).toUpperCase() || "?";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: T.gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>{avatarLetter}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{name || "이름 없음"}</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>{email || "이메일 없음"}</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>이름</label>
            <input type="text" aria-label="이름" value={name} onChange={e => setName(e.target.value)}
              placeholder="홍길동" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }} />
          </div>
          <div>
            <label style={labelStyle}>이메일 <span style={{ fontSize: 11, color: T.muted }}>(변경 불가)</span></label>
            <input type="text" aria-label="이메일" value={email} disabled
              style={{ ...inputStyle, color: T.muted, cursor: "not-allowed" }} />
          </div>
        </div>
        <button onClick={handleSave} style={{ ...saved ? btnSuccess : btnPrimary, marginTop: 20 }}>
          {saved ? "저장 완료!" : "변경사항 저장"}
        </button>
      </div>

      {/* Referral section */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 12px" }}>친구 초대</h3>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
          친구가 아래 링크로 가입하면 양쪽 모두 Pro 플랜 7일을 무료로 사용할 수 있습니다.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" readOnly value={referralLink} aria-label="추천 링크"
            style={{ ...inputStyle, fontFamily: "monospace", color: T.muted }} />
          <button onClick={handleCopy} style={{
            padding: "10px 18px", borderRadius: 8, border: "none", whiteSpace: "nowrap",
            background: copied ? "linear-gradient(135deg, #22c55e, #16a34a)" : T.gradient,
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>{copied ? "복사됨!" : "복사"}</button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...cardStyle, borderColor: "rgba(248,113,113,0.3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.red, marginBottom: 4 }}>위험 구역</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</div>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            padding: "8px 18px", borderRadius: 7, border: "1px solid rgba(248,113,113,0.4)",
            background: "rgba(248,113,113,0.08)", fontSize: 13, fontWeight: 600, color: T.red, cursor: "pointer",
          }}>계정 삭제</button>
        ) : (
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginBottom: 12 }}>
              정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); alert("계정 삭제 기능은 준비 중입니다. sales@fieldnine.io로 문의해주세요."); }}
                style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: T.red, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                삭제 확인
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: "8px 18px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, fontSize: 13, fontWeight: 600, color: T.muted, cursor: "pointer" }}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsContent() {
  const [tab, setTab] = useState<Tab>("general");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "general", label: "일반", icon: "⚙️" },
    { id: "ai", label: "AI 설정", icon: "🤖" },
    { id: "api", label: "API 키", icon: "🔑" },
    { id: "notifications", label: "알림", icon: "🔔" },
    { id: "privacy", label: "개인정보", icon: "🔒" },
  ];

  return (
    <AppShell>
      <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, fontFamily: T.fontStack }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 4 }}>설정</h1>
            <p style={{ fontSize: 14, color: T.muted }}>AI 키, 계정, 알림 등 서비스 설정을 관리합니다.</p>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="설정 탭" style={{
            display: "flex", gap: 4, marginBottom: 24,
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: 4, flexWrap: "wrap",
          }}>
            {TABS.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={{
                flex: "1 1 80px", padding: "8px 4px", borderRadius: 7, border: "none",
                background: tab === t.id ? T.accent : "transparent",
                color: tab === t.id ? "#fff" : T.muted,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}>
                <span>{t.icon}</span> <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "general" && <GeneralTab />}
          {tab === "ai" && <AISettingsTab />}
          {tab === "api" && <APIKeysTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "privacy" && <PrivacyTab />}
          {/* Legacy account tab (accessed via direct link if needed) */}

        </div>
      </div>
    </AppShell>
  );
}
