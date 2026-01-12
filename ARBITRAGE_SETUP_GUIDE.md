# 차익거래 엔진 설정 및 실행 가이드

## 🚀 빠른 시작

### 1. FastAPI 백엔드 실행

#### Windows (PowerShell)
```powershell
.\scripts\start-arbitrage-api.ps1
```

#### Linux/Mac (Bash)
```bash
chmod +x scripts/start-arbitrage-api.sh
./scripts/start-arbitrage-api.sh
```

#### 수동 실행
```bash
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### 2. 프론트엔드 실행

```bash
npm run dev
```

접속: `http://localhost:3000/arbitrage`

---

## ⚙️ 환경변수 설정

### API 서버 (`.env` 파일)

```env
# DeepSeek-V3 API (옵션)
DEEPSEEK_API_KEY=sk-...

# 거래소 API 키 (실제 거래 시 필요)
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
UPBIT_API_KEY=...
UPBIT_API_SECRET=...

# 서버 설정
PORT=8000
HOST=0.0.0.0
```

### 프론트엔드 (Vercel 환경변수)

```env
NEXT_PUBLIC_ARBITRAGE_API_URL=http://localhost:8000
```

프로덕션에서는:
```env
NEXT_PUBLIC_ARBITRAGE_API_URL=https://api.fieldnine.io
```

---

## 🔧 문제 해결

### WebSocket 연결 오류

1. **API 서버가 실행 중인지 확인**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **CORS 설정 확인**
   - `api/main.py`에서 `allow_origins` 확인

3. **방화벽 확인**
   - 포트 8000이 열려있는지 확인

### 오더북 데이터가 없음

1. **WebSocket 연결 확인**
   - Binance/Upbit WebSocket 연결 상태 확인
   - 네트워크 연결 확인

2. **로그 확인**
   - API 서버 콘솔에서 오류 메시지 확인

### 차익거래 기회가 없음

1. **정상 동작**
   - 시장 상황에 따라 기회가 없을 수 있음
   - 최소 수익 임계값 확인 (`min_profit_threshold`)

2. **설정 조정**
   - `core/arbitrage_engine.py`에서 임계값 조정:
     ```python
     self.min_profit_threshold = Decimal('30')  # $30로 낮춤
     self.min_profit_percent = Decimal('0.3')   # 0.3%로 낮춤
     ```

---

## 📊 모니터링

### API 헬스 체크

```bash
curl http://localhost:8000/api/health
```

### 차익거래 기회 조회

```bash
curl http://localhost:8000/api/opportunities
```

### WebSocket 테스트

브라우저 콘솔에서:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/opportunities');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 🎯 프로덕션 배포

### 1. API 서버 배포 (AWS/GCP)

- Docker 컨테이너로 배포
- 환경변수 설정
- 로드 밸런서 설정

### 2. 프론트엔드 배포 (Vercel)

- 환경변수 설정
- API URL 업데이트

---

**보스, 차익거래 엔진 설정 가이드 준비 완료!**
