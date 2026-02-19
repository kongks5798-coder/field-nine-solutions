"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthUser, authSignOut, type AuthUser } from "@/utils/supabase/auth";

type AIMode = "openai" | "anthropic" | "gemini";

const WORKSPACE_CARDS = [
  {
    href: "/team",
    emoji: "👥",
    title: "팀 채팅 Team",
    desc: "팀원과 실시간 채팅 + AI 어시스턴트",
    color: "#3b82f6",
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
  },
  {
    href: "/cloud",
    emoji: "☁️",
    title: "클라우드 Cloud",
    desc: "파일 업로드, 관리, 공유",
    color: "#06b6d4",
    bg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
  },
  {
    href: "/cowork",
    emoji: "📝",
    title: "코워크 CoWork",
    desc: "공유 문서 편집 + AI 자동 작성",
    color: "#8b5cf6",
    bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
  },
  {
    href: "/settings",
    emoji: "⚙️",
    title: "API 설정 Settings",
    desc: "OpenAI / Claude / Gemini 키 관리",
    color: "#f97316",
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
  },
];

const RECENT_ACTIVITY = [
  { emoji: "🤖", text: "AI 챗봇 앱 생성 완료", time: "방금 전" },
  { emoji: "📁", text: "UI_디자인_v3.png 업로드", time: "2시간 전" },
  { emoji: "💬", text: "팀 채팅: 김민준이 메시지 전송", time: "3시간 전" },
  { emoji: "📝", text: "제품 로드맵 문서 수정", time: "어제" },
];

export default function WorkspacePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiMode, setAiMode] = useState<AIMode>("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const router = useRouter();

  useEffect(() => {
    getAuthUser().then(u => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);
    });
  }, [router]);

  const handleLogout = async () => {
    await authSignOut();
    router.push("/");
  };

  const handleAI = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult("");
    try {
      const apiKey =
        typeof window !== "undefined"
          ? localStorage.getItem(
              aiMode === "openai" ? "OPENAI_API_KEY"
              : aiMode === "anthropic" ? "ANTHROPIC_API_KEY"
              : "GEMINI_API_KEY"
            ) || undefined
          : undefined;
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}\n\n(한국어로 구체적으로 답변해줘)`,
          mode: aiMode,
          apiKey,
        }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const { text } = JSON.parse(line.slice(6));
                setResult(r => r + text);
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch {
      setResult("AI 연결 오류. /settings에서 API 키를 확인해주세요.");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ color: "#9ca3af" }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* ─── Top Nav ─────────────────────────────── */}
      <nav style={{
        height: 56, display: "flex", alignItems: "center",
        padding: "0 24px", borderBottom: "1px solid #e5e7eb",
        background: "#fff", position: "sticky", top: 0, zIndex: 100,
        gap: 8,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: 24 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1b1b1f" }}>FieldNine</span>
        </Link>

        {[
          { href: "/workspace", label: "워크스페이스" },
          { href: "/team", label: "팀 Team" },
          { href: "/cloud", label: "클라우드 Cloud" },
          { href: "/cowork", label: "코워크 CoWork" },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 14,
            fontWeight: 500, textDecoration: "none", color: "#374151",
            transition: "all 0.12s",
          }}>
            {item.label}
          </Link>
        ))}

        {/* Right: user */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/settings" style={{
            padding: "5px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600,
            textDecoration: "none", color: "#374151", border: "1px solid #e5e7eb", background: "#f9fafb",
          }}>
            ⚙️ API 설정
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1b1b1f" }}>{user.name}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{user.email}</span>
            </div>
            <button onClick={handleLogout} style={{
              padding: "4px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
              background: "#fff", fontSize: 12, color: "#6b7280", cursor: "pointer",
              marginLeft: 4,
            }}>
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1b1b1f", marginBottom: 4 }}>
            안녕하세요, {user.name}님! 👋
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280" }}>
            오늘 무엇을 만들어볼까요? AI가 즉시 도와드립니다.
          </p>
        </div>

        {/* AI Prompt */}
        <div style={{
          background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16,
          overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: 36,
        }}>
          <div style={{ padding: "4px 4px 0 4px", borderBottom: "1px solid #f3f4f6", display: "flex" }}>
            <div style={{
              padding: "10px 16px", fontSize: 13, fontWeight: 600,
              color: "#f97316", borderBottom: "2px solid #f97316",
            }}>
              ⚡ AI에게 물어보기
            </div>
          </div>
          <textarea
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.metaKey && handleAI()}
            placeholder="만들고 싶은 것을 설명해주세요... (예: React 챗봇, 재고관리 시스템, 랜딩 페이지)"
            style={{
              width: "100%", padding: "16px 20px", border: "none", outline: "none",
              resize: "none", fontSize: 15, color: "#1b1b1f", lineHeight: 1.6,
              fontFamily: "inherit", background: "transparent",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderTop: "1px solid #f3f4f6",
          }}>
            <select
              value={aiMode}
              onChange={e => setAiMode(e.target.value as AIMode)}
              style={{
                padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb",
                fontSize: 12, fontWeight: 600, color: "#374151", background: "#f9fafb", outline: "none",
              }}
            >
              <option value="openai">🤖 GPT-3.5</option>
              <option value="anthropic">🟣 Claude 3</option>
              <option value="gemini">✨ Gemini</option>
            </select>
            <button
              onClick={handleAI}
              disabled={loading || !prompt.trim()}
              style={{
                padding: "9px 22px", borderRadius: 8, border: "none",
                background: loading || !prompt.trim() ? "#e5e7eb" : "#f97316",
                color: loading || !prompt.trim() ? "#9ca3af" : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {loading ? "생성 중..." : "AI 실행 →"}
            </button>
          </div>
          {result && (
            <div style={{
              padding: "16px 20px", background: "#fff7ed",
              borderTop: "1px solid #fed7aa", fontSize: 14,
              color: "#1b1b1f", lineHeight: 1.75, whiteSpace: "pre-wrap",
            }}>
              <div style={{ fontWeight: 700, color: "#f97316", marginBottom: 8, fontSize: 12 }}>
                🤖 FieldNine AI 응답
              </div>
              {result}
            </div>
          )}
        </div>

        {/* Quick access grid */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1b1b1f", marginBottom: 16 }}>
            빠른 접근 Quick Access
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {WORKSPACE_CARDS.map(card => (
              <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "20px", borderRadius: 12, background: card.bg,
                  border: "1.5px solid #e5e7eb", cursor: "pointer",
                  transition: "all 0.18s",
                }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>{card.emoji}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1b1b1f", marginBottom: 4 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{card.desc}</div>
                  <div style={{ marginTop: 12, fontSize: 12, color: card.color, fontWeight: 600 }}>
                    바로 가기 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom row: Stats + Recent */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Stats */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b1b1f", marginBottom: 16 }}>
              나의 현황 My Stats
            </h3>
            {[
              { label: "AI 요청 횟수", value: "24회", color: "#f97316" },
              { label: "업로드 파일", value: "9개", color: "#06b6d4" },
              { label: "팀 채팅 메시지", value: "47개", color: "#3b82f6" },
              { label: "문서 편집 횟수", value: "12회", color: "#8b5cf6" },
            ].map(stat => (
              <div key={stat.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{stat.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1b1b1f", marginBottom: 16 }}>
              최근 활동 Recent Activity
            </h3>
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 0", borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid #f3f4f6" : "none",
              }}>
                <span style={{ fontSize: 18 }}>{act.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#1b1b1f", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {act.text}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
