import AppShell from "@/components/AppShell";

export const metadata = {
  title: "변경 이력 — Dalkak",
  description: "Dalkak의 업데이트 히스토리",
};

/* ── 데이터 ─────────────────────────────────────────── */

type ChangeCategory = "기능" | "보안" | "개선" | "출시";

interface ChangelogEntry {
  version: string;
  date: string;
  emoji: string;
  title: string;
  category: ChangeCategory;
  changes: string[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "v2.4.0",
    date: "2026-02-24",
    emoji: "\u{1F3AE}",
    title: "게임 템플릿 갤러리",
    category: "기능",
    changes: [
      "게임 템플릿 27종 추가 (테트리스, 스네이크, 메모리 매치 등)",
      "템플릿 즉시 적용 시스템 — 클릭 한 번으로 프로젝트 생성",
      "갤러리 미리보기 및 인기순 정렬 기능",
    ],
  },
  {
    version: "v2.3.0",
    date: "2026-02-20",
    emoji: "\u{1F512}",
    title: "보안 강화",
    category: "보안",
    changes: [
      "CSRF 토큰 기반 요청 검증 도입",
      "API Rate Limiting — 분당 60회 제한, 429 응답 처리",
      "RBAC(역할 기반 접근 제어) 전면 적용",
      "웹훅 서명검증으로 외부 연동 보안 강화",
    ],
  },
  {
    version: "v2.2.0",
    date: "2026-02-15",
    emoji: "\u{1F916}",
    title: "AI 에이전트 모드",
    category: "기능",
    changes: [
      "3단계 AI 파이프라인: 계획 → 코딩 → 검토",
      "GPT-4o, Claude 3, Gemini Pro 멀티모델 지원",
      "에이전트 사고 과정 실시간 스트리밍 표시",
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-02-10",
    emoji: "\u{1F4CA}",
    title: "LM Playground",
    category: "기능",
    changes: [
      "AI 모델 비교 인터페이스 — 나란히 비교",
      "Temperature, Top-P, Max Tokens 파라미터 실시간 조절",
      "응답 품질 5점 평가 시스템",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-02-05",
    emoji: "\u{1F680}",
    title: "Dalkak 2.0",
    category: "출시",
    changes: [
      "UI/UX 전면 리뉴얼 — 다크 & 라이트 테마",
      "PWA 지원 — 오프라인에서도 사용 가능",
      "실시간 협업 — 커서 공유, 동시 편집",
      "새로운 브랜딩 및 온보딩 경험",
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-01-20",
    emoji: "\u{2601}\uFE0F",
    title: "클라우드 파일 관리",
    category: "기능",
    changes: [
      "드래그 앤 드롭 파일 업로드",
      "리스트 / 그리드 뷰 전환",
      "파일 검색 및 정렬 기능",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-01-01",
    emoji: "\u{1F389}",
    title: "정식 출시",
    category: "출시",
    changes: [
      "AI 코드 생성 — 자연어로 코드를 작성",
      "실시간 미리보기 — 코드 변경 즉시 반영",
      "팀 채팅 — 프로젝트 단위 실시간 대화",
      "클라우드 배포 — 원클릭 배포",
    ],
  },
];

const CATEGORY_COLORS: Record<ChangeCategory, string> = {
  기능: "#3b82f6",
  보안: "#f43f5e",
  개선: "#8b5cf6",
  출시: "#f97316",
};

/* ── 페이지 ──────────────────────────────────────────── */

export default function ChangelogPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: 48 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1b1b1f",
              marginBottom: 8,
              letterSpacing: "-0.5px",
            }}
          >
            변경 이력
          </h1>
          <p style={{ fontSize: 17, color: "#6b7280", fontWeight: 500 }}>
            Dalkak의 진화 과정을 확인하세요
          </p>
        </section>

        {/* Timeline */}
        <div style={{ position: "relative", paddingLeft: 36 }}>
          {/* Vertical line */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              top: 8,
              bottom: 8,
              width: 2,
              background: "#e5e7eb",
              borderRadius: 1,
            }}
          />

          {ENTRIES.map((entry, idx) => (
            <div
              key={entry.version}
              style={{
                position: "relative",
                marginBottom: idx < ENTRIES.length - 1 ? 40 : 0,
              }}
            >
              {/* Dot */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -30,
                  top: 6,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: CATEGORY_COLORS[entry.category],
                  border: "3px solid #fff",
                  boxShadow: "0 0 0 2px " + CATEGORY_COLORS[entry.category],
                }}
              />

              {/* Card */}
              <article
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {/* Version badge */}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: CATEGORY_COLORS[entry.category],
                      background:
                        CATEGORY_COLORS[entry.category] + "18",
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: `1px solid ${CATEGORY_COLORS[entry.category]}40`,
                    }}
                  >
                    {entry.version}
                  </span>

                  {/* Category */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      background: CATEGORY_COLORS[entry.category],
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {entry.category}
                  </span>

                  {/* Date */}
                  <time
                    dateTime={entry.date}
                    style={{ fontSize: 13, color: "#9ca3af", marginLeft: "auto" }}
                  >
                    {entry.date}
                  </time>
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: "#1b1b1f",
                    margin: "0 0 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{entry.emoji}</span> {entry.title}
                </h3>

                {/* Change bullets */}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {entry.changes.map((change, ci) => (
                    <li
                      key={ci}
                      style={{
                        fontSize: 14,
                        color: "#4b5563",
                        lineHeight: 1.6,
                      }}
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
