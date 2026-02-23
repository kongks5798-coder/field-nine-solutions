# /project:patrol — 전체 순찰 (3팀 순차 실행)

Dalkak 순찰 에이전트 전체 팀이 순차적으로 플랫폼을 점검합니다.

**9명의 순찰 요원, 3개 팀:**
- 🛡️ Team Shield (관리): 🎖️ Captain, 📡 Scanner, 🔍 Auditor
- ⚙️ Team Engine (유지): ⚡ Optimizer, 🧪 Tester, 📝 Documenter
- 🏥 Team Medic (보수): 🔧 Fixer, 🛡️ Guardian, 🩹 Patcher

---

## 실행 순서

### Phase 1: 🛡️ Team Shield — 관리 순찰

Team Shield가 먼저 현재 상태를 파악합니다:

1. **TypeScript 에러 탐지** (📡 Scanner)
```bash
npx tsc --noEmit 2>&1
```

2. **테스트 실행** (📡 Scanner)
```bash
npx vitest run 2>&1
```

3. **보안 감사** (🔍 Auditor)
- 하드코딩 API 키 검사 (sk-, AKIA 패턴)
- .env 파일 git 추적 여부
- 민감 정보 노출 검사

4. **코드 품질** (📡 Scanner)
- console.log 잔재 수
- any 타입 사용 수
- 미사용 import

5. **Phase 1 중간 보고** (🎖️ Captain)

---

### Phase 2: ⚙️ Team Engine — 유지 순찰

Team Engine이 성능과 유지보수 상태를 점검합니다:

1. **테스트 커버리지 분석** (🧪 Tester)
- 테스트 파일 수, 미테스트 모듈 식별

2. **빌드 사이즈 분석** (⚡ Optimizer)
```bash
npx next build 2>&1
```
- 라우트별 사이즈, 100KB 이상 경고

3. **문서 최신화 체크** (📝 Documenter)
- CHANGELOG.md, .env.example, README.md 확인

4. **의존성 상태** (⚡ Optimizer)
```bash
npm outdated 2>&1
```

5. **Phase 2 중간 보고** (⚡ Optimizer)

---

### Phase 3: 🏥 Team Medic — 보수 순찰

Team Medic이 발견된 문제를 수정합니다:

1. **빌드 에러 수정** (🔧 Fixer)
- Phase 2에서 빌드 에러가 있었으면 자동 수정

2. **테스트 실패 수정** (🔧 Fixer)
- Phase 1에서 테스트 실패가 있었으면 자동 수정

3. **TypeScript 에러 수정** (🔧 Fixer)
- Phase 1에서 TS 에러가 있었으면 자동 수정

4. **의존성 취약점 스캔** (🩹 Patcher)
```bash
npm audit 2>&1
```
- critical/high가 있으면 `npm audit fix` 실행

5. **최종 검증** (🔧 Fixer)
```bash
npx tsc --noEmit 2>&1
npx vitest run 2>&1
```

6. **Phase 3 수정 보고** (🔧 Fixer)

---

## 최종 종합 보고서

Captain이 3개 팀의 보고서를 취합하여 최종 보고서를 작성합니다:

```
╔══════════════════════════════════════════════════════╗
║  🎖️ Dalkak 순찰 에이전트 — 전체 순찰 보고서         ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  🛡️ Team Shield (관리)  ──────────────  {✅|⚠️|❌}  ║
║    📡 TypeScript 에러: {N}개                         ║
║    📡 테스트: {P}/{T} 통과                           ║
║    🔍 보안 이슈: {N}건                               ║
║    📡 코드 품질: console.log {N}, any {N}            ║
║                                                      ║
║  ⚙️ Team Engine (유지)  ──────────────  {✅|⚠️|❌}  ║
║    🧪 테스트 파일: {N}개, 미테스트 모듈: {N}개       ║
║    ⚡ 빌드: {✅|❌}, 최대 라우트: {N}KB              ║
║    📝 문서: CHANGELOG {✅|⚠️}, .env.example {✅|⚠️} ║
║    ⚡ 오래된 패키지: {N}개                           ║
║                                                      ║
║  🏥 Team Medic (보수)  ───────────────  {✅|⚠️|❌}  ║
║    🔧 수정: 빌드 {N}건, 테스트 {N}건, TS {N}건      ║
║    🩹 취약점: {C}critical {H}high {M}moderate        ║
║    🛡️ 헬스체크: {✅|❌}                              ║
║                                                      ║
║  ═══════════════════════════════════════════════════  ║
║  🎖️ 종합 판정: {✅ ALL CLEAR | ⚠️ ATTENTION | ❌ ACTION REQUIRED} ║
╚══════════════════════════════════════════════════════╝
```

## 종합 판정 기준

- ✅ **ALL CLEAR**: 3개 팀 모두 PASS
- ⚠️ **ATTENTION**: WARNING이 있지만 FAIL은 없음
- ❌ **ACTION REQUIRED**: 1개 이상의 팀이 FAIL

## 주의사항
- 전체 순찰은 시간이 오래 걸림 (빌드 포함)
- 수정 시 기존 기능을 깨뜨리지 않도록 주의
- 제품명은 "Dalkak" (딸깍) — FieldNine은 회사/도메인 이름
- 모든 수정은 검증 후 보고
