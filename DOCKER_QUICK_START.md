# Docker 빠른 시작 가이드

## 현재 상황
Docker Desktop이 실행되지 않아 빌드가 진행되지 않습니다.

## 해결 방법

### 1단계: Docker Desktop 시작
1. Windows 시작 메뉴에서 **Docker Desktop** 검색
2. **Docker Desktop** 실행
3. Docker Desktop이 완전히 시작될 때까지 대기 (시스템 트레이에 Docker 아이콘 표시)

### 2단계: Docker 상태 확인
다음 명령어로 확인:
```powershell
docker version
```

### 3단계: 빌드 및 실행
Docker Desktop이 시작되면 다음 명령어 실행:

```powershell
# 최적화된 빌드 (캐시 없이)
docker-compose build neural_nine_ai

# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 최적화 사항
- ✅ `apt-get` 옵션 최적화 (`-qq`, `--no-install-recommends`)
- ✅ pip 업그레이드 추가
- ✅ 빌드 캐시 정리 옵션

## 문제 해결
- **느린 빌드**: 네트워크 문제일 수 있습니다. VPN을 끄거나 다른 네트워크를 시도해보세요.
- **연결 오류**: Docker Desktop이 완전히 시작될 때까지 기다리세요 (1-2분 소요).
