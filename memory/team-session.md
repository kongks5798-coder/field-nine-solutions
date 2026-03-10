# Team Session: 상용화 4대 기능 — 2026-03-10

## [ANALYST]
**분석 완료**

### BACKLOG 높음 우선순위 잔여 항목
1. **결제 영수증 이메일** — Toss webhook 성공 시 Resend로 영수증 자동 발송
2. **플랜 업그레이드/다운그레이드 UI** — 현재 새 구독만 가능, 변경 불가

### INNOVATOR 추천 구현 대상 (임팩트 높은 것)
3. **AI 자동 수정 루프** — 프리뷰 콘솔 에러 감지 → Claude 자동 패치
4. **프롬프트 갤러리 + 카테고리 필터** — 홈 예시 + 쇼케이스 필터

### 관련 파일
- `src/app/api/billing/toss/webhook/route.ts` — Toss 웹훅 처리
- `src/lib/email.ts` — 이메일 함수 모음
- `src/app/billing/BillingContent.tsx` — 빌링 UI
- `src/app/api/billing/` — 빌링 API
- `src/app/workspace/page.tsx` — 워크스페이스 메인 (AI 자동 수정)
- `src/app/workspace/ai/criticAgent.ts` — Critic/Patcher 파이프라인
- `src/app/page.tsx` — 홈페이지
- `src/app/showcase/page.tsx` or `src/app/gallery/page.tsx` — 쇼케이스

### 위험 요소
- page.tsx 3700줄 — 최소 변경 원칙 적용
- Toss webhook 이미 HMAC 검증 로직 있음 — 건드리지 않기

## [ARCHITECT]
**설계 완료**

### A: 결제 영수증 이메일
- `src/app/api/billing/toss/webhook/route.ts` 내 결제 성공(DONE status) 분기에 `sendReceiptEmail()` 추가
- `src/lib/email.ts`에 `sendReceiptEmail(email, amount, planName, orderId)` 함수 추가
- Resend로 HTML 영수증 템플릿 발송

### B: 플랜 업그레이드/다운그레이드 UI
- `src/app/api/billing/upgrade/route.ts` (NEW) — 플랜 변경 처리
  - 현재 플랜 확인 → Toss 새 결제 or 다운그레이드 즉시 적용
- `src/app/billing/BillingContent.tsx`에 "현재 플랜" 표시 + 업/다운 버튼 추가
- 다운그레이드: 구독 만료 시점에 변경 (즉시 환불 X)

### C: AI 자동 수정 루프
- 프리뷰 iframe의 `console.error` / `window.onerror` 캡처 (이미 `injectConsoleCapture` 있음)
- `src/app/workspace/page.tsx`에 에러 감지 시 "AI로 수정" 버튼 표시
- 클릭 시 에러 메시지 + 현재 코드를 `/api/ai/stream`으로 전송 (Patcher 모드)
- 자동 모드: 에러 감지 3초 후 자동 패치 시작 (토글 옵션)

### D: 프롬프트 갤러리 + 카테고리 필터
- `src/app/page.tsx` 홈에 "이런 앱 만들 수 있어요" 갤러리 섹션 추가 (8개 예시)
- 쇼케이스 페이지에 카테고리 탭 필터 (전체/게임/유틸/비즈니스/교육/AI)
- DB 없이 클라이언트 필터링 (app_name 또는 태그 기반)

## [DEVELOPER]
진행 중...

## [REVIEWER]
대기 중...

## [DEPLOYER]
대기 중...
