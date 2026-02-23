# /project:patrol-maintenance — Team Engine 순찰 (유지)

Team Engine (⚙️ 유지팀)이 플랫폼 성능, 테스트, 문서 상태를 점검합니다.

**순찰 요원:**
- ⚡ Optimizer (옵티마이저) — 성능 최적화, 번들 사이즈 분석
- 🧪 Tester (테스터) — 테스트 커버리지, 회귀 테스트
- 📝 Documenter (문서관) — 문서 최신화, 변경사항 추적

---

## 1. 테스트 커버리지 확인 (🧪 Tester)

```bash
npx vitest run 2>&1
```

- 전체 테스트 수, 통과 수, 실패 수 기록
- 테스트 파일 수 카운트
- 테스트가 없는 주요 모듈 식별:
  - `src/app/api/` 내 API 라우트 중 테스트가 없는 것
  - `src/lib/` 내 유틸리티 중 테스트가 없는 것
  - `src/components/` 내 컴포넌트 중 테스트가 없는 것

## 2. 빌드 사이즈 분석 (⚡ Optimizer)

```bash
npx next build 2>&1
```

빌드 출력에서 다음을 추출:
- 전체 빌드 성공 여부
- 라우트별 사이즈 (특히 큰 페이지 식별)
- First Load JS 사이즈
- 100KB 이상 라우트가 있으면 경고

## 3. API 헬스체크 (⚡ Optimizer)

주요 API 엔드포인트의 존재 여부를 확인:
- `src/app/api/health/route.ts` — 헬스 엔드포인트 존재 확인
- `src/app/api/ai/stream/route.ts` — AI 스트림 라우트 존재 확인
- `src/app/api/ai/chat/route.ts` — AI 채팅 라우트 존재 확인
- 각 API 라우트 파일의 export 함수(GET/POST) 확인

## 4. 문서 최신화 체크 (📝 Documenter)

### 4a. CHANGELOG 확인
- `CHANGELOG.md` 파일 존재 여부
- 최근 업데이트 날짜 확인
- 최근 커밋과 CHANGELOG 동기화 여부

### 4b. 환경변수 문서화
- `.env.example` 파일 존재 여부
- 코드에서 사용하는 환경변수와 `.env.example`의 동기화 확인

### 4c. README 상태
- `README.md` 존재 여부와 기본 구조 확인

## 5. 의존성 상태 (⚡ Optimizer)

```bash
npm outdated 2>&1
```

- 주요(major) 버전 뒤처진 패키지 수
- 보안 관련 패키지 최신 여부
- devDependencies vs dependencies 분류

## 6. 성능 보고서 생성

Optimizer가 모든 결과를 취합하여 보고서를 작성합니다:

```
╔══════════════════════════════════════════════╗
║  ⚙️ Team Engine 순찰 보고서                  ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🧪 테스트:           {P}/{T} 통과  {✅|❌}  ║
║  🧪 테스트 파일 수:   {N}개                  ║
║  🧪 미테스트 모듈:    {N}개  {✅|⚠️}        ║
║  ⚡ 빌드 상태:        {✅ 성공|❌ 실패}      ║
║  ⚡ 최대 라우트 크기: {N}KB  {✅|⚠️}        ║
║  📝 CHANGELOG:        {✅ 최신|⚠️ 오래됨}   ║
║  📝 .env.example:     {✅ 동기화|⚠️ 불일치} ║
║  ⚡ 오래된 패키지:    {N}개  {✅|⚠️}        ║
║                                              ║
║  종합 상태: {✅ PASS | ⚠️ WARNING | ❌ FAIL} ║
╚══════════════════════════════════════════════╝
```

## 판정 기준

- ✅ PASS: 테스트 전체 통과, 빌드 성공, 문서 최신
- ⚠️ WARNING: 미테스트 모듈 존재, 오래된 패키지 5개 이상, 문서 오래됨
- ❌ FAIL: 테스트 실패, 빌드 실패

## 주의사항
- 빌드는 시간이 오래 걸릴 수 있음 — 타임아웃 주의
- `npm outdated`는 정보 제공용 — 자동 업데이트하지 않음
- 성능 분석은 정적 분석 기반 (실제 런타임 측정 아님)
