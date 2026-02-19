"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

type Doc = {
  id: number;
  title: string;
  emoji: string;
  updatedAt: string;
  author: string;
};

type Comment = {
  id: number;
  author: string;
  color: string;
  text: string;
  time: string;
};

type OnlineUser = {
  id: number;
  name: string;
  color: string;
  initial: string;
  cursor: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DOCS: Doc[] = [
  { id: 1, title: "FieldNine 제품 로드맵", emoji: "🗺️", updatedAt: "방금 전", author: "나" },
  { id: 2, title: "API 설계 문서", emoji: "📐", updatedAt: "1시간 전", author: "김민준" },
  { id: 3, title: "팀 규칙 & 문화", emoji: "🌱", updatedAt: "어제", author: "이서연" },
  { id: 4, title: "마케팅 전략 Q1", emoji: "📣", updatedAt: "2일 전", author: "박지호" },
];

const ONLINE_USERS: OnlineUser[] = [
  { id: 1, name: "나 (You)", color: "#f97316", initial: "나", cursor: "편집 중" },
  { id: 2, name: "김민준", color: "#3b82f6", initial: "김", cursor: "보는 중" },
  { id: 3, name: "이서연", color: "#8b5cf6", initial: "이", cursor: "편집 중" },
];

const INIT_COMMENTS: Comment[] = [
  { id: 1, author: "김민준", color: "#3b82f6", text: "로드맵에 '모바일 앱' 항목도 추가하면 어떨까요?", time: "10:32" },
  { id: 2, author: "이서연", color: "#8b5cf6", text: "디자인 시스템 문서 링크 추가 부탁드려요!", time: "10:45" },
];

const DOC_TEMPLATES = [
  { emoji: "📋", label: "회의록" },
  { emoji: "🗺️", label: "로드맵" },
  { emoji: "📐", label: "기술 설계" },
  { emoji: "📣", label: "마케팅" },
];

const DEFAULT_CONTENT = `# FieldNine 제품 로드맵

## 2026년 1분기 목표

- [ ] AI 코드 생성 기능 출시
- [ ] 팀 협업 채팅 고도화
- [ ] 클라우드 스토리지 100GB 지원
- [ ] 모바일 반응형 완성

## 기술 스택

- **프론트엔드**: Next.js 16, React 18, Stitches
- **백엔드**: Next.js API Routes, Supabase
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini

## 일정

| 기능 | 담당자 | 마감 |
|------|--------|------|
| AI 채팅 | 김민준 | 2/28 |
| 파일 업로드 | 박지호 | 3/10 |
| 디자인 시스템 | 이서연 | 3/15 |`;

const STORAGE_KEY = "cowork_doc_content";

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoWorkPage() {
  const [activeDocId, setActiveDocId] = useState(1);
  const [docContent, setDocContent] = useState(DEFAULT_CONTENT);
  const [comments, setComments] = useState<Comment[]>(INIT_COMMENTS);
  const [commentInput, setCommentInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${activeDocId}`);
    setDocContent(stored || DEFAULT_CONTENT);
    setAiResult("");
  }, [activeDocId]);

  const handleSave = () => {
    localStorage.setItem(`${STORAGE_KEY}_${activeDocId}`, docContent);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    setComments(prev => [...prev, {
      id: Date.now(),
      author: "나 (You)",
      color: "#f97316",
      text: commentInput.trim(),
      time: now,
    }]);
    setCommentInput("");
  };

  const handleAIWrite = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const apiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("OPENAI_API_KEY") || undefined
          : undefined;
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[문서 작성 도우미] 현재 문서 일부:\n${docContent.slice(0, 400)}\n\n요청: ${aiPrompt}\n\n한국어로 문서에 추가할 내용을 마크다운 형식으로 작성해주세요.`,
          mode: "openai",
          apiKey,
        }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let text = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                text += parsed.text;
                setAiResult(text);
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch {
      setAiResult("AI 오류. /settings에서 API 키를 확인하세요.");
    }
    setAiLoading(false);
  };

  const insertAIContent = () => {
    if (!aiResult) return;
    setDocContent(prev => prev + "\n\n" + aiResult);
    setAiResult("");
    setAiPrompt("");
  };

  const activeDoc = DOCS.find(d => d.id === activeDocId) || DOCS[0];

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ─── Left: Doc List ───────────────────────────── */}
        <div style={{
          width: 220, flexShrink: 0, background: "#f9fafb",
          borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#1b1b1f" }}>CoWork</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>공유 문서 · 실시간 협업</div>
          </div>

          {/* Templates */}
          <div style={{ padding: "10px 8px 8px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "0 8px", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              새 문서 New
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {DOC_TEMPLATES.map(t => (
                <button key={t.label} style={{
                  padding: "6px 4px", borderRadius: 6, border: "1px solid #e5e7eb",
                  background: "#fff", fontSize: 11, cursor: "pointer", color: "#374151",
                  textAlign: "center", fontWeight: 500,
                }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Doc list */}
          <div style={{ flex: 1, overflow: "auto", padding: "10px 8px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "0 8px", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              문서 Documents
            </div>
            {DOCS.map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                style={{
                  padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 4,
                  background: activeDocId === doc.id ? "#fff7ed" : "transparent",
                  border: activeDocId === doc.id ? "1px solid #fed7aa" : "1px solid transparent",
                  transition: "all 0.1s",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 2,
                  fontSize: 13, fontWeight: activeDocId === doc.id ? 600 : 500,
                  color: activeDocId === doc.id ? "#f97316" : "#1b1b1f",
                }}>
                  <span>{doc.emoji}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{doc.updatedAt} · {doc.author}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Center: Editor ───────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            padding: "10px 24px", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", flexShrink: 0,
          }}>
            <span style={{ fontSize: 20 }}>{activeDoc.emoji}</span>
            <div style={{ flex: 1, fontWeight: 700, fontSize: 16, color: "#1b1b1f" }}>{activeDoc.title}</div>

            {/* Online users */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {ONLINE_USERS.map((u, i) => (
                <div key={u.id} title={`${u.name} · ${u.cursor}`} style={{
                  width: 28, height: 28, borderRadius: "50%", background: u.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  border: "2px solid #fff", marginLeft: i === 0 ? 0 : -6,
                }}>
                  {u.initial}
                </div>
              ))}
              <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>
                {ONLINE_USERS.length}명 접속 중
              </span>
            </div>

            <button
              onClick={handleSave}
              style={{
                padding: "6px 16px", borderRadius: 7, border: "none",
                background: saved ? "#22c55e" : "#f97316",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {saved ? "✅ 저장됨" : "저장 Save"}
            </button>
          </div>

          {/* Markdown editor textarea */}
          <textarea
            value={docContent}
            onChange={e => setDocContent(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1, width: "100%", padding: "28px 48px",
              border: "none", outline: "none", resize: "none",
              fontSize: 15, lineHeight: 1.8, color: "#1b1b1f",
              fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
              background: "#fff",
            }}
          />

          {/* AI Write assistant bar */}
          <div style={{
            borderTop: "1px solid #e5e7eb", padding: "12px 24px",
            background: "#fff", flexShrink: 0,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f97316", marginBottom: 6 }}>
              ✨ AI 문서 도우미 — 내용 자동 생성
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAIWrite()}
                placeholder="예: '경쟁사 분석 섹션 추가', '기술 스택을 표로 정리'"
                style={{
                  flex: 1, padding: "8px 14px", borderRadius: 7,
                  border: "1px solid #e5e7eb", fontSize: 13,
                  outline: "none", color: "#1b1b1f", background: "#f9fafb",
                }}
              />
              <button
                onClick={handleAIWrite}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{
                  padding: "8px 16px", borderRadius: 7, border: "none",
                  background: aiLoading || !aiPrompt.trim() ? "#e5e7eb" : "#f97316",
                  color: aiLoading || !aiPrompt.trim() ? "#9ca3af" : "#fff",
                  fontSize: 13, fontWeight: 700,
                  cursor: aiLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
                }}
              >
                {aiLoading ? "생성 중..." : "생성 →"}
              </button>
            </div>
            {aiResult && (
              <div style={{
                marginTop: 8, padding: "10px 14px", background: "#fff7ed",
                border: "1px solid #fed7aa", borderRadius: 7, fontSize: 13,
                color: "#1b1b1f", maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap",
              }}>
                {aiResult}
                <button
                  onClick={insertAIContent}
                  style={{
                    display: "block", marginTop: 8, padding: "4px 12px",
                    borderRadius: 5, border: "none", background: "#f97316",
                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  + 문서에 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Comments & Activity ───────────────── */}
        <div style={{
          width: 260, flexShrink: 0, background: "#f9fafb",
          borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Comment list */}
          <div style={{ flex: 1, overflow: "auto", padding: "14px 12px" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 10,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              댓글 Comments ({comments.length})
            </div>
            {comments.map(c => (
              <div key={c.id} style={{
                padding: "10px", background: "#fff", borderRadius: 8,
                border: "1px solid #e5e7eb", marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {c.author.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "#1b1b1f" }}>{c.author}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.text}</div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>댓글 추가</div>
            <textarea
              rows={2}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="댓글을 입력하세요..."
              style={{
                width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb",
                borderRadius: 7, fontSize: 13, resize: "none", outline: "none",
                fontFamily: "inherit", color: "#1b1b1f", background: "#f9fafb",
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentInput.trim()}
              style={{
                width: "100%", marginTop: 6, padding: "7px 0", borderRadius: 7,
                border: "none",
                background: commentInput.trim() ? "#f97316" : "#e5e7eb",
                color: commentInput.trim() ? "#fff" : "#9ca3af",
                fontSize: 13, fontWeight: 700,
                cursor: commentInput.trim() ? "pointer" : "not-allowed",
              }}
            >
              댓글 추가
            </button>
          </div>

          {/* Recent activity */}
          <div style={{ padding: "10px 12px 14px", borderTop: "1px solid #e5e7eb" }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 8,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              최근 활동
            </div>
            {[
              { user: "이서연", color: "#8b5cf6", action: "문서 편집", time: "방금" },
              { user: "김민준", color: "#3b82f6", action: "댓글 추가", time: "5분 전" },
              { user: "나", color: "#f97316", action: "문서 저장", time: "12분 전" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: a.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {a.user.charAt(0)}
                </div>
                <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>
                  <strong>{a.user}</strong> {a.action}
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
