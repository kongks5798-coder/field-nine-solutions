# /project:patrol-management — Team Shield 순찰 (관리)

Team Shield (🛡️ 관리팀)이 플랫폼 코드 품질과 보안을 점검합니다.

**순찰 요원:**
- 🎖️ Captain (캡틴) — 팀 총괄, 이슈 우선순위 결정
- 📡 Scanner (스캐너) — 코드 품질 감시, TypeScript 에러 탐지
- 🔍 Auditor (감사관) — 보안 감사, 취약점 감시

---

## 1. TypeScript 에러 탐지 (📡 Scanner)

```bash
npx tsc --noEmit 2>&1
```

- 에러 수를 카운트하고 파일별로 분류
- 에러가 있으면 심각도(critical/warning)로 분류
- 결과: `TS_ERRORS` 수치 기록

## 2. 테스트 실행 (📡 Scanner)

```bash
npx vitest run 2>&1
```

- 전체 테스트 수, 통과 수, 실패 수 기록
- 실패 테스트가 있으면 실패 원인 요약
- 결과: `TESTS_PASSED` / `TESTS_TOTAL` 기록

## 3. 보안 감사 (🔍 Auditor)

다음 항목을 검사합니다:

### 3a. 하드코딩 API 키 검사
소스 코드에서 다음 패턴을 검색:
- `sk-` (OpenAI 키 패턴)
- `AKIA` (AWS 키 패턴)
- API 키가 문자열 리터럴로 직접 포함된 경우
- `.env`, `.env.local` 파일이 git에 추적되는지 확인

```bash
git ls-files | grep -E '\.env(\.local)?$'
```

### 3b. 민감 정보 노출 검사
- `console.log`에 민감 정보가 출력되는지 검사
- 클라이언트 코드에 서버 전용 환경변수 접근이 있는지 검사

## 4. 코드 품질 검사 (📡 Scanner)

### 4a. console.log 잔재
프로덕션 코드(`src/` 내)에서 디버그용 `console.log` 탐지:
- `src/app/`, `src/components/`, `src/lib/` 내 console.log 수 카운트
- 테스트 파일은 제외

### 4b. any 타입 사용
TypeScript `any` 타입 사용 빈도 검사:
- 명시적 `: any`, `as any` 패턴 탐지
- 파일별 카운트

### 4c. 미사용 import
- TypeScript 컴파일러 출력에서 미사용 import 관련 경고 확인

## 5. 상태 보고서 생성 (🎖️ Captain)

Captain이 모든 결과를 취합하여 보고서를 작성합니다:

```
╔══════════════════════════════════════════════╗
║  🛡️ Team Shield 순찰 보고서                 ║
╠══════════════════════════════════════════════╣
║                                              ║
║  📡 TypeScript 에러:  {N}개  {✅|⚠️|❌}     ║
║  📡 테스트 결과:      {P}/{T} 통과  {✅|❌}  ║
║  🔍 보안 이슈:        {N}건  {✅|⚠️|❌}     ║
║  📡 console.log 잔재: {N}개  {✅|⚠️}        ║
║  📡 any 타입 사용:    {N}건  {✅|⚠️}        ║
║                                              ║
║  종합 상태: {✅ PASS | ⚠️ WARNING | ❌ FAIL} ║
╚══════════════════════════════════════════════╝
```

## 판정 기준

- ✅ PASS: TS 에러 0, 테스트 전체 통과, 보안 이슈 0
- ⚠️ WARNING: console.log 5개 이상, any 타입 10개 이상, 또는 경미한 이슈
- ❌ FAIL: TS 에러 존재, 테스트 실패, 보안 취약점 발견

## 주의사항
- 제품명은 "Dalkak" (딸깍) — FieldNine은 회사/도메인 이름
- `.env.example`은 검사 대상에서 제외
- `tests/` 디렉토리의 console.log는 무시
