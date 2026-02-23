# /project:qa - 배포 전 QA 체크

배포 전 전체 품질 검증을 실행합니다. 문제가 발견되면 자동으로 수정 후 다시 검증합니다.

## 체크 항목

### 1. TypeScript 타입 체크
```bash
npx tsc --noEmit
```
- 에러가 있으면 자동 수정 시도
- 수정 불가 시 사용자에게 보고

### 2. 단위 테스트
```bash
npx vitest run
```
- 실패 테스트가 있으면 원인 분석 후 수정 시도
- 테스트 코드 문제인 경우 테스트 수정
- 프로덕션 코드 문제인 경우 프로덕션 코드 수정

### 3. 브랜딩 검증
- 제품명은 **"Dalkak" (딸깍)** — 절대 "FieldNine"으로 변경하지 않기
- FieldNine은 회사/도메인 이름으로만 사용 (F9 로고, fieldnine.io 등)
- 사용자 대면 텍스트에서 제품명이 올바른지 확인

### 4. Next.js 빌드
```bash
npx next build
```
- 빌드 실패 시 에러 분석 후 수정 시도
- RSC 직렬화 에러, Stitches SSR 문제 등 주의

### 5. 보안 체크
- `.env`, `.env.local` 파일이 커밋에 포함되지 않았는지 확인
- API 키가 하드코딩되지 않았는지 확인

## 결과 보고
모든 체크 통과 시: "QA 통과 — 배포 준비 완료" 메시지 출력
실패 항목이 있으면: 각 항목별 상태와 수정 내역 보고

## 주의사항
- Stitches `styled()` 컴포넌트는 Next.js 16 App Router에서 동작하지 않음 — 인라인 스타일 사용
- Server Component에서 `<Link style={...}>`은 빌드 에러 유발 — `<a href>` 사용
- `validateEnv()`는 빌드 시 스킵됨 (`NEXT_PHASE` 체크)
