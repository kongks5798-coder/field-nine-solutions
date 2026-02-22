# FieldNine — AI App Builder Platform

> AI로 30초 만에 앱을 만드세요. GPT-4o · Claude Sonnet · Gemini · Grok 지원.

**Production**: https://fieldnine.io
**Status**: https://fieldnine.io/status
**API Docs**: https://fieldnine.io/api/docs

---

## 빠른 시작

```bash
# 1. 의존성 설치
npm ci --legacy-peer-deps

# 2. 환경변수 설정
cp .env.example .env.local
# .env.local 편집

# 3. 개발 서버 실행
npm run dev
```

---

## 환경변수

### 필수 (없으면 서버 시작 불가)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### AI 모델 (최소 1개)

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=AI...
XAI_API_KEY=xai-...
```

### 결제

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...

# TossPayments
TOSSPAYMENTS_SECRET_KEY=live_sk_...
```

### 기타

```env
RESEND_API_KEY=re_...          # 이메일 발송
NEXT_PUBLIC_SENTRY_DSN=https://... # 에러 추적
UPSTASH_REDIS_REST_URL=https://... # Rate limiting (없으면 in-memory fallback)
UPSTASH_REDIS_REST_TOKEN=...
CRON_SECRET=...                # Vercel Cron 인증
ADMIN_SECRET=...               # 어드민 API 인증
NEXT_PUBLIC_APP_URL=https://fieldnine.io
```

---

## 스크립트

```bash
npm run dev              # 개발 서버 (localhost:3000)
npm run build            # 프로덕션 빌드
npm run typecheck        # TypeScript 타입 체크
npm run lint             # ESLint
npm run test:unit        # 단위 테스트 (Vitest)
npm run test:unit:watch  # 단위 테스트 watch 모드
npm run test:unit:coverage # 커버리지 리포트
npm run test:e2e         # E2E 테스트 (Playwright)
npm run test:e2e:ui      # Playwright UI 모드
```

---

## 아키텍처

```
src/
├── app/
│   ├── api/             # 49개 API 라우트
│   │   ├── ai/          # AI 스트리밍 (SSE), 채팅
│   │   ├── billing/     # Stripe / TossPayments / Polar 결제
│   │   ├── projects/    # 프로젝트 CRUD + 배포
│   │   ├── tokens/      # 토큰 잔액 (낙관적 잠금)
│   │   ├── health/      # 헬스체크
│   │   ├── docs/        # OpenAPI 3.0 문서
│   │   └── admin/       # 어드민 전용 (역할 기반)
│   ├── workspace/       # AI 코드 에디터 (메인 기능)
│   ├── pricing/         # 요금제 페이지
│   ├── status/          # 서비스 상태 페이지
│   └── ...
├── components/          # 공통 컴포넌트 (AppShell 등)
├── lib/
│   ├── logger.ts        # Pino 구조화 로깅
│   ├── env.ts           # 환경변수 검증
│   └── email.ts         # Resend 이메일
├── middleware.ts         # Rate limiting + 인증 미들웨어
└── utils/supabase/      # Supabase 클라이언트
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Next-Auth |
| AI | OpenAI · Anthropic · Gemini · Grok |
| 결제 | Stripe · TossPayments · Polar |
| 로깅 | Pino (structured JSON) |
| 에러 추적 | Sentry (server + edge + client) |
| Rate Limiting | Upstash Redis (in-memory fallback) |
| PWA | Service Worker v2 + offline fallback |
| 스타일 | Tailwind CSS · MUI v7 · Stitches |
| 테스트 | Vitest (unit) · Playwright (E2E) |
| CI/CD | GitHub Actions · Vercel |

---

## CI 파이프라인

`main` 브랜치 push / PR 시 자동 실행:

1. **TypeScript** — `tsc --noEmit`
2. **Lint** — ESLint
3. **Unit Tests** — Vitest (17개+)
4. **Build** — Next.js 프로덕션 빌드
5. **Security Audit** — `npm audit --audit-level=high`
6. **E2E** — Playwright (main push 시)

---

## 보안

- **Rate Limiting**: 전역 120req/min, API 30req/min (Upstash Redis / in-memory fallback)
- **인증**: Supabase 세션 쿠키, 보호된 경로 미들웨어 검사
- **역할 기반 접근제어**: admin 경로는 DB role 검증
- **감사 로그**: 모든 rate limit 위반, admin 접근 거부 기록
- **입력 검증**: Zod 스키마 검증 (주요 API)

---

## 배포

```bash
# Vercel 프로덕션 배포
npx vercel --prod
```

Vercel 환경변수는 Vercel 대시보드 또는 CLI로 설정:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```
