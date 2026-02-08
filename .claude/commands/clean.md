# /project:clean - 캐시 정리

Next.js 캐시와 node_modules 정리

## 실행 내용
1. .next 폴더 삭제
2. node_modules/.cache 삭제
3. npm install 재실행

## 명령어
```bash
# 캐시 정리
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue

# 의존성 재설치
npm install
```
