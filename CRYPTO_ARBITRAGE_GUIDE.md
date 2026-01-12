# 🦾 Field Nine: Crypto Arbitrage Engine 가이드

## 📋 개요

Binance와 Upbit 간 BTC/USDT 차익거래 기회를 모니터링하는 봇입니다.

### 기능
- 실시간 시세 모니터링 (Binance vs Upbit)
- 수익 기회 자동 감지
- 수수료 고려한 순수익 계산
- 차익거래 실행 (향후 구현)

---

## 🚀 로컬 실행 (Python)

### 1. 패키지 설치

```bash
pip install -r scripts/requirements-crypto.txt
```

또는 직접 설치:
```bash
pip install ccxt python-dotenv
```

### 2. 환경변수 설정 (옵션)

`.env` 파일 생성:
```env
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
UPBIT_API_KEY=your_upbit_api_key
UPBIT_API_SECRET=your_upbit_api_secret
```

**참고**: API 키 없이도 시세 조회는 가능합니다. 거래만 API 키가 필요합니다.

### 3. 실행

```bash
python scripts/crypto-arbitrage-bot.py
```

### 4. 출력 예시

```
🦾 JARVIS: Starting Profit Engine on fieldnine.io...
⏰ Started at: 2026-01-11 12:00:00
------------------------------------------------------------

🎯 Opportunity #1 Found! [2026-01-11 12:05:30]
   Binance BTC/USDT: $42,500.00
   Upbit BTC/KRW: ₩59,500,000 ($42,500.00)
   Price Difference: $50.00
   Net Profit: $47.50 (0.11%)
   💰 Estimated Profit: +$47.50
------------------------------------------------------------
```

---

## ☁️ AWS Lambda 배포 (Node.js)

### 1. Lambda 함수 생성

```bash
aws lambda create-function \
  --function-name field-nine-crypto-arbitrage \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://crypto-arbitrage.zip \
  --timeout 30 \
  --memory-size 512
```

### 2. 의존성 설치 및 배포

```bash
cd aws/lambda/crypto-arbitrage
npm install axios
zip -r crypto-arbitrage.zip index.js node_modules/

aws lambda update-function-code \
  --function-name field-nine-crypto-arbitrage \
  --zip-file fileb://crypto-arbitrage.zip
```

### 3. API Gateway 연결

```bash
# 리소스 생성
aws apigateway create-resource \
  --rest-api-id YOUR_API_ID \
  --parent-id ROOT_RESOURCE_ID \
  --path-part crypto-arbitrage

# Lambda 통합
aws apigateway put-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id CRYPTO_ARBITRAGE_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-northeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-northeast-2:YOUR_ACCOUNT_ID:function:field-nine-crypto-arbitrage/invocations
```

### 4. 테스트

```bash
curl "https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/crypto-arbitrage?minProfit=50&minProfitPercent=0.5"
```

**예상 응답:**
```json
{
  "success": true,
  "hasOpportunity": true,
  "opportunity": {
    "netProfit": 47.5,
    "profitPercent": 0.11,
    "priceDiff": 50,
    "binancePrice": 42500,
    "upbitPriceUSD": 42450,
    "upbitPriceKRW": 59430000,
    "timestamp": "2026-01-11T12:05:30.000Z"
  },
  "thresholds": {
    "minProfit": 50,
    "minProfitPercent": 0.5
  }
}
```

---

## ⚙️ 설정 옵션

### Python 봇 설정

`scripts/crypto-arbitrage-bot.py`에서 수정:

```python
min_profit_threshold = 50      # 최소 수익 임계값 (USD)
min_profit_percent = 0.5       # 최소 수익률 (%)
monitoring_interval = 0.1      # 모니터링 간격 (초)
```

### Lambda 함수 설정

쿼리 파라미터로 전달:
- `minProfit`: 최소 수익 임계값 (기본값: 50)
- `minProfitPercent`: 최소 수익률 (기본값: 0.5)

---

## 🔐 API 키 발급

### Binance
1. https://www.binance.com/en/my/settings/api-management 접속
2. API 키 생성
3. Spot & Margin Trading 권한 활성화

### Upbit
1. https://upbit.com/mypage/open_api_management 접속
2. Open API 키 발급
3. 읽기/주문 권한 설정

**주의**: API 키는 반드시 환경변수로 관리하세요!

---

## 💡 향후 개선 사항

### 1. 실제 거래 실행
```python
def execute_arbitrage_trade(binance, upbit, binance_price, upbit_price_krw):
    # 1. Binance에서 BTC 구매
    # 2. Upbit에서 BTC 판매
    # 3. 수익 확인
    pass
```

### 2. 다중 거래소 지원
- Coinbase, Kraken, Bithumb 등 추가

### 3. 자동화된 리밸런싱
- 포트폴리오 자동 재조정

### 4. 알림 시스템
- Slack, Discord, 이메일 알림

### 5. 대시보드 통합
- 실시간 차익거래 기회 대시보드

---

## ⚠️ 주의사항

1. **거래 위험**: 실제 거래 전 충분한 테스트 필요
2. **수수료**: 거래소 수수료를 정확히 계산해야 함
3. **환율 변동**: USD/KRW 환율 실시간 반영 필요
4. **API 제한**: 거래소 API Rate Limit 주의
5. **법적 책임**: 거래에 대한 모든 책임은 사용자에게 있음

---

## 🐛 문제 해결

### WSL 연결 오류
```bash
wsl --shutdown
# WSL 재시작
```

### API 키 오류
- 환경변수 확인
- API 키 권한 확인
- IP 화이트리스트 확인 (Binance)

### 네트워크 오류
- 인터넷 연결 확인
- 방화벽 설정 확인
- VPN 사용 시 비활성화

---

## 📊 성능 최적화

### Python 봇
- `monitoring_interval` 조정 (0.1초 → 1초)
- 비동기 처리 (asyncio)

### Lambda 함수
- CloudWatch Events로 주기적 실행
- Step Functions로 워크플로우 구성

---

**보스, 암호화폐 차익거래 엔진 준비 완료!**

Python 봇으로 로컬 실행하거나, Lambda 함수로 서버리스 배포 가능합니다.
