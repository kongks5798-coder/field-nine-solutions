# /project:patrol-repair — Team Medic 순찰 (보수)

Team Medic (🏥 보수팀)이 플랫폼 에러를 수정하고 의존성을 점검합니다.

**순찰 요원:**
- 🔧 Fixer (수리공) — 빌드 에러 자동 수정, 런타임 에러 대응
- 🛡️ Guardian (가디언) — 서비스 모니터링, 헬스체크
- 🩹 Patcher (패쳐) — 의존성 취약점 스캔, 호환성 패치

---

## 1. 빌드 에러 수정 (🔧 Fixer)

```bash
npx next build 2>&1
```

- 빌드 실패 시 에러 메시지를 분석하고 자동 수정
- 수정 후 다시 빌드하여 검증 (최대 3회 반복)
- 주의할 패턴:
  - RSC 직렬화 에러 → Server Component에서 이벤트 핸들러 제거
  - `<Link style={...}>` 에러 → Server Component에서 `<a href>` 사용
  - Stitches `styled()` 에러 → 인라인 스타일로 변환
  - import 경로 에러 → 올바른 경로로 수정

## 2. 테스트 실패 수정 (🔧 Fixer)

```bash
npx vitest run 2>&1
```

- 실패 테스트가 있으면:
  1. 실패 원인 분석 (테스트 코드 vs 프로덕션 코드)
  2. 테스트 코드 문제 → 테스트 수정
  3. 프로덕션 코드 문제 → 프로덕션 코드 수정
  4. 수정 후 재실행하여 검증
- 같은 에러가 3회 반복되면 다른 접근법 시도

## 3. TypeScript 에러 수정 (🔧 Fixer)

```bash
npx tsc --noEmit 2>&1
```

- 각 에러의 파일과 라인을 읽고 자동 수정
- 수정 후 다시 검증 (최대 3회 반복)
- 타입 에러 수정 시 기존 기능을 깨뜨리지 않도록 주의

## 4. 의존성 취약점 스캔 (🩹 Patcher)

```bash
npm audit 2>&1
```

- 취약점 수준별 분류: critical, high, moderate, low
- critical/high 취약점이 있으면 수정 시도:

```bash
npm audit fix 2>&1
```

- `npm audit fix`로 해결되지 않는 경우 수동 분석 필요 표시
- breaking change가 필요한 경우 (`npm audit fix --force`)는 자동 실행하지 않고 보고만 함

## 5. 서비스 헬스체크 (🛡️ Guardian)

다음 파일들이 정상적으로 존재하고 올바른 export를 가지는지 확인:
- `src/app/api/health/route.ts` — GET 핸들러 존재 확인
- `src/app/layout.tsx` — 루트 레이아웃 정상 확인
- `src/app/page.tsx` — 메인 페이지 정상 확인
- `next.config.ts` 또는 `next.config.js` — 설정 파일 정상 확인

## 6. 자동 수정 후 검증 (🔧 Fixer)

모든 수정이 완료된 후 최종 검증:

```bash
npx tsc --noEmit 2>&1
npx vitest run 2>&1
```

- TypeScript 에러 0건 확인
- 테스트 전체 통과 확인
- 수정으로 인한 새로운 에러가 없는지 확인

## 7. 수정 보고서 생성

Fixer가 모든 결과를 취합하여 보고서를 작성합니다:

```
╔══════════════════════════════════════════════╗
║  🏥 Team Medic 순찰 보고서                   ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🔧 빌드 에러:     {N}건 발견 → {M}건 수정   ║
║  🔧 테스트 실패:   {N}건 발견 → {M}건 수정   ║
║  🔧 TS 에러:       {N}건 발견 → {M}건 수정   ║
║  🩹 취약점:        {C}critical {H}high       ║
║  🩹 자동 수정:     {N}건 적용                ║
║  🛡️ 헬스체크:     {✅ 정상|❌ 이상}          ║
║                                              ║
║  종합 상태: {✅ PASS | ⚠️ WARNING | ❌ FAIL} ║
╚══════════════════════════════════════════════╝
```

## 판정 기준

- ✅ PASS: 모든 에러 수정 완료, 취약점 없음, 헬스체크 정상
- ⚠️ WARNING: moderate/low 취약점 존재, 수동 확인 필요 항목 있음
- ❌ FAIL: 수정 불가한 에러 존재, critical 취약점 존재

## 수정 원칙
- 에러가 발생하면 반드시 수정한다
- 수정 후 반드시 재검증한다
- 같은 에러가 3회 반복되면 다른 접근법을 시도한다
- 모든 수정은 기존 기능을 깨뜨리지 않아야 한다
- `npm audit fix --force`는 절대 자동 실행하지 않는다
