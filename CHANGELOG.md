# Changelog

모든 주목할 만한 변경사항은 이 파일에 기록됩니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

---

## [Unreleased]

---

## [1.3.0] - 2026-02-23

### 추가
- 코드 품질 전면 개선: SWR 캐싱, 접근성(a11y) 속성, E2E 테스트, 에러 처리 강화
- TossPayments SDK `window.alert` 차단 — 도메인 미등록 시 native alert 방지
- 무료 플랜 월 30회 AI 한도 제한 + billing 충전 결과 배너 표시
- AI 한도 초과 시 TopUp 결제 모달 + `/dashboard` 미들웨어 보호 적용

### 수정
- 잔존 브랜드명 정리 (TrendStream → Dalkak, FieldNine → Dalkak)
- `/api/ai/chat` 세션 인증 추가
- `/api/lm/generate` 인증 추가 + 미들웨어 레이트리밋 등록

---

## [1.2.0] - 2026-02-23

### 추가
- 메인페이지 간소화 + PWA 설치 지원 + 예시 프롬프트 + 회원가입 데이터 수집 고지
- PostHog 자동 페이지뷰 추적
- Sentry `withSentryConfig` next.config.ts 래핑
- `sendPlanChangedEmail` 추가 — 관리자 플랜 변경 이메일 알림
- 결제 완료 후 workspace welcome 토스트 표시
- `/api/cowork` 미들웨어 보호 + pricing 페이지 체험 D-day 배너
- AppShell에 청구(Billing) 링크 + 무료체험 D-day 배지 추가
- 구독 취소 버튼 billing 페이지에 추가
- Trial countdown banner + easy pay 버튼 + `/api/auth/me` 프로필 확장
- Auto-migration 시스템 + admin DB migrate 패널
- 코워크 Supabase 영구저장 + 14일 무료체험 자동화 + 체험 리마인드 이메일

### 성능 개선
- `billing/usage` POST 집계 쿼리 최적화
- `auth/me` 병렬 쿼리 처리

### 수정
- Sentry deprecated 옵션 제거 (`autoInstrumentServerFunctions`, `Middleware`, `disableLogger`)
- 미들웨어 레이트리밋 공백 처리 + billing/ai 버그 수정
- analytics/published API 에러 처리 개선
- CSP `script-src` `*.tosspayments.com` 와일드카드 적용으로 결제 오류 해결

---

## [1.1.0] - 2026-02-23

### 추가
- 코워크 AI 에이전트 5종 + LM 개발 시스템 구축
- 결제 완료 후 플랜별 토큰 자동 충전
- TossPayments 초기화 실패 시 `console.warn`으로 원인 로깅
- `tossLoading` 상태로 버튼 비활성화 조건 분리 — 키 미설정/SDK 실패 시에도 버튼 활성화 유지

### 수정
- TossPayments 결제 확인 후 `plan_expires_at` 정확히 저장
- Gemini 불필요한 삼항 연산자 제거
- `ai_calls` 증분, slug collision, iframe XSS, avgPerDay 버그 수정
- 기본 결제사를 토스페이먼츠로 변경
- 문의 API, 이메일, webhook 쿼리, alert 제거 등 일괄 버그 수정

---

## [1.0.0] - 초기 릴리즈

### 추가
- FieldNine 프로젝트 최초 릴리즈
- Next.js App Router 기반 AI 협업 워크스페이스
- Supabase 인증 및 데이터베이스 연동
- OpenAI / Anthropic / Google Gemini AI 스트리밍 지원
- TossPayments 한국 결제 + Stripe 해외 결제 통합
- 코워크(CoWork) 협업 문서 에디터
- 클라우드 파일 매니저
- AI 팀 채팅
- 관리자 대시보드 (revenue, audit log, DB migration)
