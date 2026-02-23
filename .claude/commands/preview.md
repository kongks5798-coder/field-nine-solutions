# /project:preview - 배포 전 전체 기능 프리뷰 테스트

배포 전에 모든 기능을 검증하고 결과를 보고합니다.

## 실행 순서

### 1. 빌드 검증
```bash
npx tsc --noEmit
npx vitest run
npx next build
```
모든 단계 통과 필수.

### 2. 페이지 렌더링 검증
각 페이지가 빌드에 포함되어 있는지 확인:
- `/` — 홈페이지
- `/workspace` — 워크스페이스 IDE
- `/dashboard` — 대시보드
- `/lab` — 개발실
- `/lm` — LM 허브
- `/flow` — 플로우
- `/canvas` — 캔버스
- `/collab` — 콜라보
- `/team` — 팀
- `/cloud` — 클라우드
- `/cowork` — 코워크
- `/pricing` — 요금제
- `/admin` — 관리자
- `/admin/lab` — 관리자 개발실

### 3. API 라우트 검증
빌드 출력에서 다음 API들이 포함되어 있는지 확인:
- `/api/health`
- `/api/ai/stream`, `/api/ai/chat`
- `/api/lab/tournaments`, `/api/lab/breakthroughs`
- `/api/billing/*`
- `/api/payment/*`

### 4. 브랜딩 검증
- 제품명 "Dalkak" (딸깍) 확인
- FieldNine은 회사/도메인으로만 사용

### 5. 스타일 검증
- Stitches styled() 컴포넌트가 사용되지 않는지 확인
- 모든 페이지가 인라인 스타일 또는 CSS className 사용

### 6. 보안 검증
- .env 파일이 git에 포함되지 않았는지 확인
- API 키 하드코딩 없음 확인

## 결과 보고
각 항목별 PASS/FAIL 상태를 보고합니다.
모든 항목 PASS 시: "프리뷰 검증 완료 — 배포 준비 완료"
FAIL 항목이 있으면: 자동 수정 시도 후 재검증
