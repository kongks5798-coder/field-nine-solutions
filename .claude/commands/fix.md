# /project:fix - 빌드 에러 자동 수정

빌드 에러와 린트 에러를 확인하고 수정합니다.

## 실행 내용
1. ESLint 자동 수정
2. TypeScript 에러 확인
3. 빌드 테스트

## 명령어
```bash
# 린트 자동 수정
npm run lint -- --fix

# 타입 체크
npx tsc --noEmit

# 빌드 테스트
npm run build
```
