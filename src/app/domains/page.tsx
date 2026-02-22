"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

const T = {
  bg: "#050508", panel: "#0b0b14", surface: "#0f0f1a",
  border: "rgba(255,255,255,0.07)", text: "#d4d8e2",
  muted: "#4a5066", accent: "#f97316", accentB: "#f43f5e",
  green: "#22c55e", red: "#f87171",
};

type Domain = {
  id: string;
  domain: string;
  project_id: string | null;
  project_name: string;
  status: "active" | "pending" | "error";
  cname_value: string;
  created_at: string;
};

const DNS_STEPS = [
  { step: 1, title: "CNAME 레코드 추가", desc: "DNS 설정에서 아래 값을 입력하세요.", value: "cname.fieldnine.io" },
  { step: 2, title: "인증 대기", desc: "DNS 전파에 최대 48시간이 소요됩니다.", value: "자동 처리" },
  { step: 3, title: "SSL 발급", desc: "Let's Encrypt SSL 인증서가 자동 발급됩니다.", value: "자동 처리" },
];

export default function DomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { showToast: _showToast, toastElement } = useToast();

  const showToast = (msg: string) => _showToast(msg, "info");

  // Load domains from server
  useEffect(() => {
    fetch("/api/domains")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.domains)) setDomains(d.domains); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addDomain = async () => {
    const d = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!d || !d.includes(".")) { showToast("올바른 도메인을 입력해주세요."); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(`⚠️ ${data.error ?? "추가 실패"}`); return; }
      setDomains(p => [data.domain, ...p]);
      setNewDomain("");
      setShowGuide(true);
      showToast("✅ 도메인이 추가됐습니다. DNS 설정을 완료해주세요.");
    } catch {
      showToast("⚠️ 서버 연결 실패");
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (id: string) => {
    // Optimistic UI
    setDomains(p => p.filter(d => d.id !== id));
    try {
      const res = await fetch(`/api/domains/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("⚠️ 삭제 실패 — 다시 시도해주세요");
        // Reload to restore
        fetch("/api/domains").then(r => r.json()).then(d => { if (Array.isArray(d.domains)) setDomains(d.domains); });
      } else {
        showToast("도메인이 삭제됐습니다.");
      }
    } catch {
      showToast("⚠️ 서버 연결 실패");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: '"Pretendard","Inter",-apple-system,sans-serif' }}>
      {/* Nav */}
      <nav style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(5,5,8,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#f97316,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11, color: "#fff" }}>F9</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>FieldNine</span>
          </button>
          <span style={{ color: T.muted, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>커스텀 도메인</span>
        </div>
        <button onClick={() => router.push("/workspace")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>워크스페이스</button>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 8 }}>🌐 커스텀 도메인</h1>
          <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>
            내 도메인을 연결해서 배포된 앱에 커스텀 URL을 사용하세요.<br />
            SSL 인증서는 자동으로 발급됩니다.
          </p>
        </div>

        {/* Plan notice */}
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>프로 플랜 이상에서 사용 가능</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>커스텀 도메인은 프로 플랜부터 사용할 수 있습니다.</div>
          </div>
          <button onClick={() => router.push("/pricing")}
            style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            업그레이드
          </button>
        </div>

        {/* Add domain */}
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>새 도메인 추가</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addDomain()}
              placeholder="예: myapp.com 또는 app.mycompany.com"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit",
              }}
            />
            <button onClick={addDomain} disabled={adding}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: adding ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#f97316,#f43f5e)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: adding ? "wait" : "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              {adding ? (
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "추가하기"}
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
            💡 서브도메인 (app.mycompany.com) 또는 루트 도메인 (mycompany.com) 모두 지원됩니다.
          </div>
        </div>

        {/* DNS Guide */}
        {showGuide && (
          <div style={{ padding: "24px", borderRadius: 16, background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>📋 DNS 설정 가이드</div>
              <button onClick={() => setShowGuide(false)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {DNS_STEPS.map(s => (
                <div key={s.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{s.desc}</div>
                    {s.value !== "자동 처리" && (
                      <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "monospace", color: T.accent, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>{s.value}</span>
                        <button onClick={() => navigator.clipboard.writeText(s.value).then(() => showToast("복사됨")).catch(() => {})}
                          style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11 }}>복사</button>
                      </div>
                    )}
                    {s.value === "자동 처리" && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: T.green, fontSize: 11, fontWeight: 600 }}>
                        ✓ 자동 처리
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Domains list */}
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>연결된 도메인 ({domains.length})</div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px", color: T.muted, fontSize: 13 }}>
              <div style={{ width: 20, height: 20, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
              로드 중...
            </div>
          ) : domains.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: T.muted, fontSize: 13 }}>
              아직 연결된 도메인이 없습니다.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {domains.map(d => (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🌐 {d.domain}
                      </span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: d.status === "active" ? "rgba(34,197,94,0.12)" : d.status === "pending" ? "rgba(251,146,60,0.12)" : "rgba(248,113,113,0.12)",
                        color: d.status === "active" ? T.green : d.status === "pending" ? T.accent : T.red,
                      }}>
                        {d.status === "active" ? "✓ 활성" : d.status === "pending" ? "⏳ 대기" : "⚠ 오류"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {d.project_name} · CNAME: {d.cname_value} · {new Date(d.created_at).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {d.status === "active" && (
                      <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, textDecoration: "none", cursor: "pointer" }}>
                        열기 ↗
                      </a>
                    )}
                    {d.status === "pending" && (
                      <button onClick={() => setShowGuide(true)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid rgba(249,115,22,0.3)`, background: "transparent", color: T.accent, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                        설정 보기
                      </button>
                    )}
                    <button onClick={() => removeDomain(d.id)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid rgba(248,113,113,0.2)`, background: "transparent", color: T.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
          {[
            { icon: "🔒", title: "무료 SSL", desc: "모든 커스텀 도메인에 Let's Encrypt SSL이 자동 발급됩니다." },
            { icon: "⚡", title: "글로벌 CDN", desc: "Cloudflare를 통해 전 세계 어디서나 빠르게 서비스됩니다." },
            { icon: "🔄", title: "자동 갱신", desc: "SSL 인증서는 만료 30일 전에 자동으로 갱신됩니다." },
            { icon: "📊", title: "트래픽 분석", desc: "연결된 도메인의 방문자 수와 트래픽을 실시간 확인하세요." },
          ].map((f, i) => (
            <div key={i} style={{ padding: "16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toastElement}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
