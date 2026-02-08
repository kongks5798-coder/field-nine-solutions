# 🚀 Field Nine 차익거래 엔진

고성능 암호화폐 차익거래 엔진 - 김치 프리미엄 & 삼각 차익거래 자동화 시스템

## ✨ 주요 기능

- ✅ **실시간 차익거래 탐지**: Binance ↔ Upbit 김치 프리미엄 자동 감지
- ✅ **Fee-Optimized Path**: 수수료를 고려한 최적 경로 계산
- ✅ **DeepSeek-V3 리스크 헤징**: AI 기반 실시간 리스크 평가 및 헤징 전략
- ✅ **실제 거래 실행**: Binance/Upbit API 통합, 동시 주문 처리
- ✅ **실시간 모니터링**: WebSocket 기반 실시간 대시보드
- ✅ **데이터 관리**: PostgreSQL + Redis, 실행 기록 저장

## 🏗️ 아키텍처

```
Frontend (Next.js)
    ↓ WebSocket / REST API
API Gateway (FastAPI)
    ↓
Core Engine
├── ArbitrageEngine (차익거래 로직)
├── OrderBookCollector (실시간 오더북)
├── RiskHedger (DeepSeek-V3 리스크 헤징)
├── ExecutionEngine (주문 실행)
├── ExchangeAPI (Binance/Upbit)
└── Monitoring (성능 메트릭)
    ↓
Database
├── PostgreSQL (메인 데이터)
└── Redis (캐싱)
```

## 🚀 빠른 시작

### 1. API 서버 실행

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

### 3. 접속

```
http://localhost:3000/arbitrage
```

## 📋 환경변수 설정

```env
# 거래소 API (실제 거래 시 필수)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
UPBIT_ACCESS_KEY=your_upbit_access_key
UPBIT_SECRET_KEY=your_upbit_secret_key

# AI
DEEPSEEK_API_KEY=sk-...

# 데이터베이스
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379

# 알림 (옵션)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## 📊 API 엔드포인트

### REST API
- `GET /api/health` - 헬스 체크
- `GET /api/opportunities` - 차익거래 기회 조회
- `POST /api/execute` - 차익거래 실행
- `GET /api/stats` - 통계 조회
- `GET /api/alerts` - 알림 조회

### WebSocket
- `WS /ws/orderbook` - 실시간 오더북
- `WS /ws/opportunities` - 실시간 기회 알림

## 🧪 테스트

```bash
# 통합 테스트
.\scripts\test-arbitrage.ps1

# 성능 테스트
python scripts/performance-test.py
```

## 📚 문서

- [기술 명세서](docs/CRYPTO_ARBITRAGE_ENGINE_SPEC.md)
- [설정 가이드](ARBITRAGE_SETUP_GUIDE.md)
- [빠른 시작](ARBITRAGE_QUICK_START.md)
- [배포 가이드](DEPLOY_ARBITRAGE.md)

## 🎯 성능 목표

- 레이턴시: < 100ms
- 처리량: 동시 10개 주문
- 정확도: Fee-optimized Path 계산
- 안정성: 자동 재연결, 롤백 지원

## 🔒 보안

- RLS 정책 적용
- 환경변수 관리
- API 키 암호화 (프로덕션)
- 레이트 리밋 처리

## 📈 완성도

**현재: 97%**

- [x] Phase 1: 기본 인프라
- [x] Phase 2: 데이터베이스 통합
- [x] Phase 3: 거래소 API 통합
- [x] 모니터링 시스템
- [x] 테스트 스크립트
- [ ] 프로덕션 배포 테스트 (3% 남음)

---

**Field Nine - Tesla of Arbitrage** 🚀
