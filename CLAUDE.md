# Dalkak (딸깍) — AI App Builder

> fieldnine.io | 1인 개발자 | 팀 에이전트로 100x 운영

---

## 프로젝트 핵심 정보

**제품명**: 딸깍 (Dalkak)
**회사**: FieldNine
**URL**: https://fieldnine.io
**목적**: 한국어 프롬프트로 웹앱을 즉시 생성하는 AI 앱 빌더

---

## 기술 스택

```
Frontend:  Next.js 16.1.6 (App Router + Pages hybrid), React 18, TypeScript strict
Styling:   Inline styles (dark IDE theme), Tailwind 없음
AI:        Anthropic Claude (Haiku/Sonnet), OpenAI GPT, Google Gemini
           → /api/ai/stream (SSE), /api/ai/chat (JSON)
DB:        Supabase (Postgres + Auth + RLS)
결제:       Toss Payments (@tosspayments/tosspayments-sdk)
이메일:     Resend
배포:       Vercel (Edge Functions)
테스트:     Vitest (1744 unit tests), Playwright (E2E)
```

---

## 색상/디자인 시스템

```
배경:      #050508 (최상위), #0d1117 (카드), #1e293b (입력)
강조:      #f97316 (오렌지 — 브랜드 색)
텍스트:    #f0f4f8 (주요), #94a3b8 (보조), #475569 (비활성)
성공:      #22c55e  경고: #eab308  에러: #ef4444
테두리:    rgba(255,255,255,0.08) (일반), rgba(249,115,22,0.35) (강조)
```

---

## 핵심 파일 위치

```
워크스페이스:    src/app/workspace/page.tsx (메인, ~3700줄)
AI 파이프라인:   src/app/workspace/ai/teamPipeline.ts
스트리밍:        src/app/workspace/ai/streamTeam.ts
Critic/Patcher:  src/app/workspace/ai/criticAgent.ts
AI 스토어:       src/app/workspace/stores.ts
프리뷰 빌더:     src/app/workspace/workspace.constants.ts (buildPreview)
템플릿:          src/app/workspace/workspace.templates.ts (49개)
홈페이지:        src/app/page.tsx
레이아웃:        src/app/layout.tsx
인증:            src/middleware.ts

API:
  AI 스트리밍:   src/app/api/ai/stream/route.ts
  배포(인증):    src/app/api/projects/publish/route.ts
  배포(익명):    src/app/api/projects/publish-anon/route.ts
  결제:          src/app/api/billing/toss/
  이메일:        src/lib/email.ts

공유 유틸:
  분석:          src/lib/analytics.ts
  배지:          src/lib/dalkakBadge.ts
  레이트리밋:    src/lib/rateLimit.ts
  상수:          src/lib/constants.ts
```

---

## AI 파이프라인 구조

```
사용자 프롬프트
    ↓
🎯 Architect (Haiku, ~3s)  — 설계 스펙 정의
    ↓
[병렬 실행 Promise.all]
🏗️ HTML Builder (Sonnet)
🎨 CSS Builder  (Sonnet)   → 동시 생성 (~15s)
⚙️ JS Builder   (Sonnet)
    ↓
🔍 Critic (Haiku, ~5s)     — 품질 검증 (점수 0-100)
    ↓ (점수 < 75 또는 critical 이슈 있을 때만)
🔧 Patcher (Sonnet, ~8s)   — 자동 수정
    ↓
총 ~31s (legacy 대비 4x 빠름)
```

---

## 코딩 규칙

```typescript
// ✅ 새 API 라우트 필수 패턴
import { checkLimitInMemory } from "@/lib/rateLimit";
// rate limit 먼저, auth 확인, zod 검증, 에러 처리

// ✅ 새 페이지 컴포넌트
"use client";
// inline styles 사용 (Tailwind 사용 금지)
// 색상은 위의 색상 시스템 따르기

// ✅ 이벤트 트래킹
import { track } from "@/lib/analytics";
track("event_name", { key: "value" });

// ❌ 절대 금지
import { styled } from "@stitches/react";  // Stitches styled() — Next.js 16 비호환
any  // TypeScript any 사용 금지
eval()  // XSS 위험
```

---

## 자동화 시스템

| 시스템 | 트리거 | 역할 |
|--------|--------|------|
| PostToolUse Hook | 파일 수정 즉시 | tsc 자동 체크 |
| ai-review.yml | PR 오픈 | Claude 코드리뷰 |
| post-deploy-e2e.yml | main push | Playwright QA |
| security-scan.yml | 매주 월요일 | 보안 감사 |
| issue-implement.yml | Issue 라벨 | AI 자동 구현 |
| weekly-sprint.yml | 매주 월요일 | BACKLOG 자동 실행 |
| cron/refresh-featured | 매일 00:00 UTC | 오늘의 딸깍 갱신 |
| cron/cleanup-anon-apps | 매일 02:00 UTC | 익명앱 30일 삭제 |

---

## 작업 시 참고

1. **BACKLOG.md** 먼저 읽기 — 현재 우선순위 확인
2. 빌드: `npx tsc --noEmit` → `npx next build`
3. 배포: `npx vercel --prod --yes`
4. 테스트: `npx vitest run` (1744 tests)

---

## 환경변수 (Vercel에 설정 필요한 것들)

```bash
# 결제
TOSSPAYMENTS_CLIENT_KEY=live_ck_...
TOSSPAYMENTS_SECRET_KEY=live_sk_...
TOSSPAYMENTS_WEBHOOK_SECRET=<gen-secrets.ts로 생성>

# 모니터링
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# 자동화
CRON_SECRET=<gen-secrets.ts로 생성>
UNSUBSCRIBE_SECRET=<gen-secrets.ts로 생성>
ANTHROPIC_API_KEY=sk-ant-...  # GitHub Secrets에도 추가

# Supabase (이미 설정됨)
NEXT_PUBLIC_SUPABASE_URL=https://gflbuujjotqpflrbgtpd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```
