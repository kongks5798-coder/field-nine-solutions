# 🚀 차익거래 엔진 빠른 시작 가이드

## ✅ 즉시 실행 가능

### 1단계: API 서버 시작 (5분)

#### Windows
```powershell
cd api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

#### Linux/Mac
```bash
cd api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

**확인:** `http://localhost:8000/api/health` 접속 시 JSON 응답 확인

### 2단계: 프론트엔드 실행

```bash
npm run dev
```

**접속:** `http://localhost:3000/arbitrage`

---

## 🎯 주요 기능

### ✅ 완료된 기능

1. **실시간 오더북 수집**
   - Binance WebSocket 연결
   - Upbit WebSocket 연결
   - 자동 재연결

2. **차익거래 기회 탐지**
   - 김치 프리미엄 계산
   - Fee-optimized Path
   - 수수료 자동 계산

3. **리스크 헤징**
   - DeepSeek-V3 통합 (옵션)
   - 기본 리스크 평가
   - 자동 헤징 전략

4. **React 대시보드**
   - 실시간 WebSocket 연결
   - 레이턴시 모니터링
   - 원클릭 실행

5. **에러 핸들링**
   - WebSocket 재연결
   - REST API 폴백
   - Mock 데이터 지원

---

## 🔧 문제 해결

### WebSocket 연결 안 됨

1. **API 서버 확인**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **포트 확인**
   - 포트 8000이 사용 중인지 확인
   - 방화벽 설정 확인

3. **환경변수 확인**
   ```env
   NEXT_PUBLIC_ARBITRAGE_API_URL=http://localhost:8000
   ```

### 차익거래 기회가 없음

**정상 동작입니다!**
- 시장 상황에 따라 기회가 없을 수 있음
- Mock 데이터로 UI 테스트 가능
- 실제 거래소 연결 시 실시간 기회 표시

---

## 📊 API 엔드포인트

### REST API

- `GET /api/health` - 헬스 체크
- `GET /api/opportunities` - 차익거래 기회 조회
- `POST /api/execute` - 차익거래 실행

### WebSocket

- `WS /ws/orderbook` - 실시간 오더북
- `WS /ws/opportunities` - 실시간 기회 알림

---

## 🎨 대시보드 기능

1. **연결 상태 표시**
   - 실시간 WebSocket 연결 상태
   - 레이턴시 모니터링

2. **차익거래 기회 카드**
   - 수익 금액 표시
   - 리스크 스코어
   - Fee-optimized 배지

3. **원클릭 실행**
   - 리스크 평가 후 실행
   - 실행 결과 표시

---

## 🚀 프로덕션 배포

### Docker 배포

```bash
docker-compose -f docker-compose.arbitrage.yml up -d
```

### Vercel 배포

프론트엔드는 자동 배포됩니다.
환경변수만 설정하면 됩니다:

```env
NEXT_PUBLIC_ARBITRAGE_API_URL=https://api.fieldnine.io
```

---

**보스, 차익거래 엔진 완벽하게 구동 준비 완료!**

이제 바로 실행 가능합니다! 🎉
