# 기여 가이드

## 개발 환경 설정
1. Node.js 20+ 설치
2. `npm ci --legacy-peer-deps`
3. `.env.local` 설정 (`.env.example` 참고)
4. `npm run dev`

## 브랜치 전략
- `main` — 프로덕션 (Vercel 자동 배포)
- `develop` — 개발 통합
- `feat/*` — 기능 개발
- `fix/*` — 버그 수정

## PR 체크리스트
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx vitest run` 전체 테스트 통과
- [ ] `npx next build` 빌드 성공
- [ ] 새 API 라우트 → Zod 입력 검증 필수
- [ ] 새 페이지 → layout.tsx에 메타데이터 추가
- [ ] 결제 관련 → 웹훅 서명 검증 필수

## 코드 스타일
- TypeScript strict 모드
- `as any` 사용 금지 — 타입 가드 또는 Zod 스키마 사용
- 인라인 스타일 사용 (CSS 모듈 없음)
- 테마 색상: `#f97316` (주황), `#f43f5e` (핑크), `#07080f` (배경)
- 한국어 UI, 영어 코드/변수명

## 테스트
- 유닛: `npx vitest run` (tests/unit/)
- E2E: `npx playwright test` (tests/e2e/)
- 새 API 라우트마다 테스트 파일 필수

## 커밋 메시지
```
feat: 기능 설명
fix: 버그 수정 설명
chore: 유지보수 작업
```
