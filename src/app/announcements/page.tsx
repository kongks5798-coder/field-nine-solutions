import { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "공지사항 | Dalkak",
  description: "Dalkak의 서비스 공지사항, 점검 안내, 정책 변경 사항을 확인하세요.",
};

/* ── Types ─────────────────────────────────────────────── */
type AnnType = "공지" | "업데이트" | "점검" | "정책";

interface Announcement {
  id: number;
  type: AnnType;
  title: string;
  date: string;
  pinned?: boolean;
  body: string;
}

/* ── Data ──────────────────────────────────────────────── */
const TYPE_COLORS: Record<AnnType, { bg: string; text: string; border: string }> = {
  공지:   { bg: "#fff7ed", text: "#f97316", border: "#fed7aa" },
  업데이트: { bg: "#eff6ff", text: "#3b82f6", border: "#bfdbfe" },
  점검:   { bg: "#fef2f2", text: "#ef4444", border: "#fecaca" },
  정책:   { bg: "#f5f3ff", text: "#8b5cf6", border: "#ddd6fe" },
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    type: "공지",
    title: "Dalkak V5.0 정식 출시 안내",
    date: "2026-03-08",
    pinned: true,
    body: "안녕하세요, Dalkak 팀입니다.\n\nV5.0이 정식 출시되었습니다. 이번 업데이트에는 버전 히스토리, 템플릿 마켓플레이스(100+ 템플릿), AI 디버깅 에이전트, 소셜 로그인(Google·Kakao·GitHub), 팀 기능 완성, 실시간 협업 링크 공유 등 대규모 기능이 포함되어 있습니다.\n\n무료 플랜 사용자도 템플릿 마켓의 기본 템플릿 10종을 이용하실 수 있습니다. 자세한 변경 사항은 변경 이력 페이지를 참고해 주세요.\n\n감사합니다.",
  },
  {
    id: 2,
    type: "업데이트",
    title: "AI 모델 업그레이드 — GPT-4o, Claude 3.7, Gemini 2.0, Grok 3",
    date: "2026-03-01",
    body: "Dalkak에서 사용 가능한 AI 모델이 업그레이드됩니다.\n\n• GPT-4o → GPT-4o 최신 버전\n• Claude 3 Sonnet → Claude 3.7 Sonnet\n• Gemini Pro → Gemini 2.0 Flash\n• Grok 2 → Grok 3\n\n모든 플랜에서 4개 모델을 사용할 수 있으며, 프로 플랜은 고성능 모드(더 긴 컨텍스트, 더 정밀한 생성)를 지원합니다.",
  },
  {
    id: 3,
    type: "점검",
    title: "[완료] 정기 서버 점검 (2026-02-22 03:00~05:00 KST)",
    date: "2026-02-20",
    body: "안녕하세요.\n\n아래 일정으로 정기 서버 점검을 진행합니다.\n\n• 일시: 2026년 2월 22일 (일) 오전 3:00 ~ 5:00 (KST)\n• 대상: AI 생성 기능, 배포 서비스\n• 영향: 점검 시간 동안 워크스페이스 및 배포 기능 일시 중단\n\n점검 중 저장되지 않은 작업은 자동 임시저장됩니다. 불편을 드려 죄송합니다.\n\n[완료] 예정 시간보다 20분 일찍 완료되었습니다.",
  },
  {
    id: 4,
    type: "정책",
    title: "개인정보 처리방침 개정 안내 (2026-03-01 시행)",
    date: "2026-02-15",
    body: "Dalkak 개인정보 처리방침이 일부 개정됩니다.\n\n주요 변경 사항:\n1. AI 학습 데이터 활용 정책 명확화 — 사용자 프로젝트 코드는 AI 학습에 사용되지 않음을 명시\n2. 데이터 보존 기간 구체화 — 계정 삭제 후 30일 내 완전 삭제\n3. 제3자 서비스 연동 목록 업데이트 — Stripe, TossPayments 추가\n\n개정된 방침은 2026년 3월 1일부터 시행됩니다. 계속 서비스를 이용하시면 개정된 방침에 동의한 것으로 간주됩니다.",
  },
  {
    id: 5,
    type: "업데이트",
    title: "결제 대시보드 및 청구 관리 기능 오픈",
    date: "2026-02-10",
    body: "청구 페이지가 전면 개편되었습니다.\n\n새로운 기능:\n• 실시간 사용량 모니터링 — AI 생성 횟수, 스토리지, API 호출량\n• 청구서 발행 및 다운로드 (PDF)\n• 카드 관리 — 카드 추가/삭제/기본 카드 변경\n• 플랜 변경 즉시 적용 — 업그레이드 시 잔여 기간 일할 계산\n• 팀 플랜 멤버별 사용량 추적",
  },
  {
    id: 6,
    type: "공지",
    title: "무료 플랜 생성 횟수 상향 — 월 30회 → 50회",
    date: "2026-02-01",
    body: "무료 플랜 사용자 여러분께 좋은 소식입니다!\n\nDalkak을 더 많은 분들이 경험할 수 있도록 무료 플랜의 월간 AI 생성 횟수를 30회에서 50회로 상향합니다.\n\n기존 사용자도 2026년 2월 1일부터 자동으로 적용됩니다. 별도 조치 없이 바로 50회의 생성을 사용하실 수 있습니다.\n\n더 자유롭게 Dalkak을 경험해보세요!",
  },
];

/* ── Page ──────────────────────────────────────────────── */
export default function AnnouncementsPage() {
  const pinned = ANNOUNCEMENTS.filter((a) => a.pinned);
  const rest = ANNOUNCEMENTS.filter((a) => !a.pinned);

  return (
    <AppShell>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1b1b1f",
              marginBottom: 8,
              letterSpacing: "-0.5px",
            }}
          >
            📢 공지사항
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280" }}>
            서비스 공지, 업데이트 안내, 점검 일정을 확인하세요
          </p>
        </section>

        {/* Type filter legend */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {(Object.keys(TYPE_COLORS) as AnnType[]).map((type) => {
            const c = TYPE_COLORS[type];
            return (
              <span
                key={type}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: c.bg,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                }}
              >
                {type}
              </span>
            );
          })}
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
              📌 고정 공지
            </h2>
            {pinned.map((ann) => (
              <AnnouncementCard key={ann.id} ann={ann} highlight />
            ))}
          </div>
        )}

        {/* All announcements */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
            전체 공지
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rest.map((ann) => (
              <AnnouncementCard key={ann.id} ann={ann} />
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: 48,
          padding: 24,
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>🔔</div>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1b1b1f" }}>
              공지사항 알림 받기
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
              중요 공지, 업데이트, 점검 일정을 이메일로 먼저 받아보세요.
            </p>
            <Link href="/settings" style={{
              padding: "7px 16px",
              borderRadius: 8,
              background: "#f97316",
              color: "#fff",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
            }}>
              알림 설정하기
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ── Card Component ────────────────────────────────────── */
function AnnouncementCard({
  ann,
  highlight,
}: {
  ann: Announcement;
  highlight?: boolean;
}) {
  const c = TYPE_COLORS[ann.type];
  const lines = ann.body.split("\n");

  return (
    <article
      style={{
        background: "#fff",
        border: `1px solid ${highlight ? "#fed7aa" : "#e5e7eb"}`,
        borderRadius: 14,
        padding: "20px 24px",
        boxShadow: highlight ? "0 2px 12px rgba(249,115,22,0.08)" : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
          flexShrink: 0,
        }}>
          {ann.type}
        </span>
        {ann.pinned && (
          <span style={{ fontSize: 11, color: "#f97316", fontWeight: 700, flexShrink: 0 }}>
            📌 고정
          </span>
        )}
        <time style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>
          {ann.date}
        </time>
      </div>

      <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700, color: "#1b1b1f", lineHeight: 1.4 }}>
        {ann.title}
      </h3>

      {/* Body: show first 2 lines */}
      <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.7 }}>
        {lines.slice(0, 3).map((line, i) => (
          <p key={i} style={{ margin: "0 0 4px" }}>{line || "\u00A0"}</p>
        ))}
        {lines.length > 3 && (
          <p style={{ margin: "8px 0 0", color: "#9ca3af", fontSize: 13 }}>
            ... (더 보기)
          </p>
        )}
      </div>
    </article>
  );
}
