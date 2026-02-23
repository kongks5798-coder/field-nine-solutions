# /project:deploy - Vercel 배포

프로덕션 배포를 실행합니다. **반드시 QA 체크를 먼저 수행합니다.**

## 실행 순서

### Step 1. QA 체크 (배포 전 필수)
```bash
# 타입 체크
npx tsc --noEmit

# 단위 테스트
npx vitest run
```
- 타입 에러 또는 테스트 실패 시 자동 수정 시도
- 수정 후 다시 검증
- QA 통과하지 않으면 배포하지 않음

### Step 2. 브랜딩 확인
- 제품명 "Dalkak" (딸깍) 유지 확인
- FieldNine은 회사/도메인으로만 사용

### Step 3. Next.js 빌드
```bash
npx next build
```

### Step 4. Vercel 프로덕션 배포
```bash
npx vercel --prod
```

### Step 5. 배포 후 확인
- 배포 URL 출력
- fieldnine.io / www.fieldnine.io 매핑 확인

## 주의사항
- QA 미통과 시 배포 금지
- 빌드 에러 발생 시 자동 수정 후 재시도
- Stitches styled() 컴포넌트는 사용하지 않기 (Next.js 16 비호환)
