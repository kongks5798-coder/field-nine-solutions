# /project:status - 프로젝트 상태 확인

현재 프로젝트 상태를 종합적으로 확인합니다.

## 확인 내용
1. Git 상태 (변경된 파일)
2. 개발 서버 실행 여부
3. 빌드 에러 확인
4. TypeScript 에러 확인

## 명령어
```bash
# Git 상태
git status

# 포트 확인
netstat -ano | findstr :3000

# 타입 체크
npx tsc --noEmit
```
