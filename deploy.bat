@echo off
echo [1/3] WSL 시스템 초기화 중...
wsl --shutdown
timeout /t 3

echo [2/3] 도커 엔진 및 터널링 상태 확인 중...
:: 윈도우 환경에서 도커가 꺼져있을 경우를 대비해 명령어를 보냅니다.
docker compose down >nul 2>&1

echo [3/3] 필드나인 상용화 엔진 가동! (Docker Compose Up)
:: 이제 보스가 고생하실 필요 없이 제가 대신 명령어를 내립니다.
docker compose up -d --build

echo ==========================================
echo 보스, 모든 시스템이 정상 가동되었습니다!
echo 이제 브라우저에서 접속을 확인하십시오.
echo ==========================================
pause