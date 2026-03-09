# Dalkak (딸깍) — Product Backlog

> 이 파일이 작업 큐입니다. 대화 대신 여기에 기록하세요.
> Claude에게: "BACKLOG.md 읽고 높음 우선순위 전부 진행시켜"

---

## 🔴 높음 — 수익/리텐션 직결

- [ ] **Toss live 키 전환** — test_ck_ → live_ck_ (Vercel 환경변수 수동)
- [ ] **Resend 이메일 시퀀스** — 가입→웰컴(즉시), 7일 재방문, 30일 결제 유도
- [ ] **결제 영수증 이메일** — Toss webhook 성공 시 Resend로 영수증 자동 발송
- [ ] **플랜 업그레이드/다운그레이드 UI** — 현재 새 구독만 가능, 변경 불가
- [ ] **구독 취소 플로우** — 취소 사유 수집 + 혜택 제시 후 취소

---

## 🟠 중간 — UX/전환율

- [ ] **온보딩 A/B 테스트** — 웰컴 메시지 2버전 + PostHog funnel 측정
- [ ] **앱 북마크** — 마음에 드는 타인 앱 저장 기능
- [ ] **생성 히스토리** — 워크스페이스에서 이전 생성 프롬프트 재사용
- [ ] **모바일 반응형 개선** — 현재 워크스페이스 모바일 UX 열악
- [ ] **프롬프트 갤러리** — "이런 앱 만들 수 있어요" 예시 10개 (홈페이지)
- [ ] **앱 카테고리 필터** — 쇼케이스에서 게임/유틸/비즈니스/교육 필터
- [ ] **공유 OG 이미지 개선** — 앱 스크린샷 기반 OG (현재 텍스트만)

---

## 🟡 낮음 — 개선사항

- [ ] **다크/라이트 모드 토글** — 현재 다크 고정
- [ ] **키보드 단축키 안내 개선** — 워크스페이스 첫 접속 시 툴팁
- [ ] **앱 삭제 기능** — 내 앱 목록에서 삭제 불가 (현재)
- [ ] **코드 다운로드 포맷** — ZIP 외 개별 파일 다운로드
- [ ] **PWA 오프라인 지원** — 마지막 앱 오프라인에서 보기
- [ ] **접근성 개선** — aria-label, 키보드 탐색 전체 검토

---

## 🔵 기술 부채

- [ ] **Supabase SQL 실행** — `108_commercial_missing.sql` (수동 실행 필요)
- [ ] **SENTRY_DSN 환경변수** — Vercel에 추가 필요 (코드는 준비됨)
- [ ] **POSTHOG 환경변수** — Vercel에 추가 필요 (코드는 준비됨)
- [ ] **CRON_SECRET** — Vercel에 추가 필요
- [ ] **ANTHROPIC_API_KEY** — GitHub Secrets에 추가 필요
- [ ] **workspace/page.tsx 분리** — 3700줄 → 500줄 컴포넌트로 분할
- [ ] **테스트 커버리지** — API 라우트 unit test 보완

---

## ✅ 완료

- [x] 팀 에이전트 파이프라인 (Architect→HTML/CSS/JS→Critic→Patcher)
- [x] GitHub Actions AI 코드리뷰
- [x] 주간 보안 감사 자동화
- [x] "딸깍으로 만들었어요" 바이럴 배지
- [x] 오늘의 딸깍 (품질 기반 큐레이션)
- [x] 프롬프트 자동완성 (Tab 키)
- [x] AI 코드 설명 패널
- [x] Vercel Cron (익명앱 정리 + 피처드 갱신)
- [x] Claude Code Hooks (파일 수정 → tsc 자동체크)
- [x] MCP 서버 설정 (Context7, Sequential Thinking, Supabase)
- [x] Playwright E2E post-deploy QA
- [x] GDPR (계정삭제, 데이터 내보내기, 이메일 수신거부)
- [x] Toss webhook HMAC 검증
- [x] Rate limiting (Upstash + 인메모리 폴백)
