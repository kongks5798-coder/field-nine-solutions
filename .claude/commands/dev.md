# /project:dev - 개발 서버 시작

개발 서버를 시작하고 상태를 확인합니다.

## 실행 내용
1. 기존 서버 프로세스 확인
2. 포트 3000 사용 중이면 종료
3. npm run dev 실행
4. 서버 시작 확인

## 명령어
```bash
# 포트 확인
netstat -ano | findstr :3000

# 서버 시작
cd C:\Users\polor\field-nine-solutions && npm run dev
```
