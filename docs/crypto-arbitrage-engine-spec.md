# Field Nine: 고성능 암호화폐 차익거래 엔진 기술 명세서
## Version 1.0 | 2026-01-12

---

## 📋 Executive Summary

본 문서는 글로벌 거래소(Binance)와 국내 거래소(Upbit) 간의 **김치 프리미엄(Kimchi Premium)** 및 **삼각 차익거래(Triangular Arbitrage)**를 수행하는 고성능 자동매매 시스템의 기술 명세를 정의합니다.

**핵심 목표:**
- 실시간 가격 차이 감지 및 자동 실행
- DeepSeek-V3 기반 리스크 헤징 의사결정
- 레이턴시 < 50ms 보장
- Fee-optimized Path 자동 계산
- Tesla Style React 대시보드 연동

---

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  Tesla Style Dashboard - Real-time Monitoring              │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket / REST API
┌──────────────────────▼──────────────────────────────────────┐
│              API Gateway (FastAPI)                          │
│  - Authentication & Rate Limiting                          │
│  - Request Routing                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│  Order Book  │ │ Arbitrage │ │ Risk      │
│  Collector   │ │ Engine    │ │ Hedger    │
│  (WebSocket) │ │ (Asyncio) │ │ (DeepSeek)│
└───────┬──────┘ └────┬──────┘ └────┬──────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼──────┐ ┌────▼──────┐
│   Binance    │ │   Upbit   │ │  Database │
│   Exchange   │ │  Exchange │ │ (Redis +  │
│              │ │           │ │ PostgreSQL)│
└──────────────┘ └───────────┘ └───────────┘
```

### 1.2 기술 스택

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Frontend | React + TypeScript | 18.3+ | Tesla Style 대시보드 |
| Backend | FastAPI + Python | 3.11+ | 고성능 비동기 API |
| WebSocket | websockets + asyncio | Latest | 실시간 오더북 수집 |
| AI Agent | DeepSeek-V3 API | Latest | 리스크 헤징 의사결정 |
| Database | Redis + PostgreSQL | 7.0+ / 15+ | 캐싱 + 영구 저장 |
| Message Queue | RabbitMQ / Redis Streams | Latest | 이벤트 스트리밍 |

---

## 2. 실시간 오더북 수집 시스템

### 2.1 WebSocket 멀티스레딩 구조

```python
# core/orderbook_collector.py
import asyncio
import websockets
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class OrderBookSnapshot:
    exchange: str
    symbol: str
    bids: List[tuple]  # [(price, quantity), ...]
    asks: List[tuple]
    timestamp: float
    sequence_id: int

class OrderBookCollector:
    """
    멀티 거래소 WebSocket 오더북 수집기
    - 비동기 병렬 처리
    - 자동 재연결
    - 메시지 순서 보장
    """
    
    def __init__(self):
        self.connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.orderbooks: Dict[str, OrderBookSnapshot] = {}
        self.lock = asyncio.Lock()
        
    async def connect_binance(self):
        """Binance WebSocket 연결"""
        uri = "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms"
        
        while True:
            try:
                async with websockets.connect(uri) as ws:
                    self.connections['binance'] = ws
                    async for message in ws:
                        await self._process_binance_message(message)
            except Exception as e:
                print(f"Binance 연결 오류: {e}")
                await asyncio.sleep(5)  # 5초 후 재연결
    
    async def connect_upbit(self):
        """Upbit WebSocket 연결"""
        uri = "wss://api.upbit.com/websocket/v1"
        
        while True:
            try:
                async with websockets.connect(uri) as ws:
                    self.connections['upbit'] = ws
                    # Upbit 구독 메시지 전송
                    subscribe_msg = [
                        {"ticket": "field-nine-arbitrage"},
                        {
                            "type": "orderbook",
                            "codes": ["KRW-BTC"]
                        }
                    ]
                    await ws.send(json.dumps(subscribe_msg))
                    
                    async for message in ws:
                        await self._process_upbit_message(message)
            except Exception as e:
                print(f"Upbit 연결 오류: {e}")
                await asyncio.sleep(5)
    
    async def _process_binance_message(self, message: str):
        """Binance 메시지 처리"""
        data = json.loads(message)
        
        async with self.lock:
            self.orderbooks['binance'] = OrderBookSnapshot(
                exchange='binance',
                symbol='BTC/USDT',
                bids=[(float(b[0]), float(b[1])) for b in data.get('bids', [])],
                asks=[(float(a[0]), float(a[1])) for a in data.get('asks', [])],
                timestamp=datetime.now().timestamp(),
                sequence_id=data.get('lastUpdateId', 0)
            )
    
    async def _process_upbit_message(self, message: bytes):
        """Upbit 메시지 처리"""
        data = json.loads(message.decode('utf-8'))
        
        async with self.lock:
            self.orderbooks['upbit'] = OrderBookSnapshot(
                exchange='upbit',
                symbol='BTC/KRW',
                bids=[(b['price'], b['size']) for b in data.get('orderbook_units', [])],
                asks=[(a['price'], a['size']) for a in data.get('orderbook_units', [])],
                timestamp=datetime.now().timestamp(),
                sequence_id=data.get('seq', 0)
            )
    
    async def start(self):
        """모든 거래소 연결 시작"""
        await asyncio.gather(
            self.connect_binance(),
            self.connect_upbit(),
        )
    
    def get_latest_orderbook(self, exchange: str) -> OrderBookSnapshot:
        """최신 오더북 조회 (스레드 안전)"""
        return self.orderbooks.get(exchange)
```

### 2.2 성능 최적화

- **병렬 처리**: `asyncio.gather()`로 다중 거래소 동시 연결
- **메시지 버퍼링**: Redis Streams로 오더북 스냅샷 캐싱
- **레이턴시 모니터링**: 각 메시지 타임스탬프 추적

---

## 3. 차익거래 엔진 (Asyncio 기반)

### 3.1 Fee-Optimized Path 계산

```python
# core/arbitrage_engine.py
import asyncio
from typing import Optional, Tuple
from decimal import Decimal
from dataclasses import dataclass

@dataclass
class ArbitrageOpportunity:
    path: str  # 예: "BTC/USDT -> BTC/KRW -> USDT/KRW"
    profit_usd: Decimal
    profit_percent: Decimal
    execution_time_ms: float
    risk_score: float  # 0-1 (낮을수록 안전)
    fee_optimized: bool

class ArbitrageEngine:
    """
    실시간 차익거래 기회 탐지 및 실행 엔진
    """
    
    # 거래소 수수료 (Maker/Taker)
    FEES = {
        'binance': {'maker': 0.001, 'taker': 0.001},  # 0.1%
        'upbit': {'maker': 0.0005, 'taker': 0.0005},  # 0.05%
    }
    
    # 환율 (USD/KRW) - 실시간 업데이트 필요
    EXCHANGE_RATE = 1400  # 기본값, 실제로는 API에서 가져옴
    
    def __init__(self, orderbook_collector: OrderBookCollector):
        self.collector = orderbook_collector
        self.min_profit_threshold = Decimal('50')  # 최소 $50 수익
        self.min_profit_percent = Decimal('0.5')  # 최소 0.5%
    
    async def find_arbitrage_opportunities(self) -> List[ArbitrageOpportunity]:
        """
        실시간 차익거래 기회 탐지
        """
        opportunities = []
        
        # 1. 김치 프리미엄 탐지 (직접 차익거래)
        kimchi_opp = await self._detect_kimchi_premium()
        if kimchi_opp:
            opportunities.append(kimchi_opp)
        
        # 2. 삼각 차익거래 탐지
        triangular_opps = await self._detect_triangular_arbitrage()
        opportunities.extend(triangular_opps)
        
        # 3. Fee-optimized Path 필터링
        filtered = [opp for opp in opportunities if opp.fee_optimized]
        
        return sorted(filtered, key=lambda x: x.profit_usd, reverse=True)
    
    async def _detect_kimchi_premium(self) -> Optional[ArbitrageOpportunity]:
        """
        김치 프리미엄 탐지: Binance BTC/USDT vs Upbit BTC/KRW
        """
        binance_ob = self.collector.get_latest_orderbook('binance')
        upbit_ob = self.collector.get_latest_orderbook('upbit')
        
        if not binance_ob or not upbit_ob:
            return None
        
        # Binance 최고 매도가 (Ask)
        binance_ask_price = Decimal(str(binance_ob.asks[0][0]))
        
        # Upbit 최고 매수가 (Bid)
        upbit_bid_price_krw = Decimal(str(upbit_ob.bids[0][0]))
        upbit_bid_price_usd = upbit_bid_price_krw / Decimal(str(self.EXCHANGE_RATE))
        
        # 가격 차이 계산
        price_diff = upbit_bid_price_usd - binance_ask_price
        
        # 수수료 고려
        binance_fee = binance_ask_price * Decimal(str(self.FEES['binance']['taker']))
        upbit_fee = upbit_bid_price_usd * Decimal(str(self.FEES['upbit']['taker']))
        total_fees = binance_fee + upbit_fee
        
        # 순수익 계산
        net_profit = price_diff - total_fees
        profit_percent = (net_profit / binance_ask_price) * Decimal('100')
        
        # 최소 수익 임계값 확인
        if net_profit < self.min_profit_threshold or profit_percent < self.min_profit_percent:
            return None
        
        return ArbitrageOpportunity(
            path="BTC/USDT (Binance) -> BTC/KRW (Upbit)",
            profit_usd=net_profit,
            profit_percent=profit_percent,
            execution_time_ms=50.0,  # 예상 실행 시간
            risk_score=0.3,  # 낮은 리스크
            fee_optimized=True
        )
    
    async def _detect_triangular_arbitrage(self) -> List[ArbitrageOpportunity]:
        """
        삼각 차익거래 탐지
        예: USDT -> BTC -> KRW -> USDT
        """
        opportunities = []
        
        # TODO: 삼각 차익거래 로직 구현
        # 1. USDT로 BTC 구매 (Binance)
        # 2. BTC를 KRW로 판매 (Upbit)
        # 3. KRW를 USDT로 환전 (환율 고려)
        # 4. 수익성 계산
        
        return opportunities
    
    async def execute_arbitrage(self, opportunity: ArbitrageOpportunity) -> bool:
        """
        차익거래 실행
        """
        # TODO: 실제 주문 실행 로직
        # 1. 주문 전송 (Binance + Upbit 동시)
        # 2. 주문 상태 모니터링
        # 3. 성공/실패 처리
        
        return True
```

### 3.2 비동기 실행 엔진

```python
# core/execution_engine.py
import asyncio
from typing import Dict, List
from datetime import datetime

class ExecutionEngine:
    """
    고성능 비동기 실행 엔진
    - 레이턴시 최소화
    - 동시 주문 처리
    - 실시간 상태 모니터링
    """
    
    def __init__(self):
        self.pending_orders: Dict[str, dict] = {}
        self.execution_queue = asyncio.Queue()
        self.max_concurrent_orders = 10
        self.semaphore = asyncio.Semaphore(self.max_concurrent_orders)
    
    async def execute_order_pair(self, buy_order: dict, sell_order: dict):
        """
        동시 주문 실행 (Binance + Upbit)
        """
        async with self.semaphore:
            start_time = datetime.now()
            
            # 동시 주문 전송
            buy_task = asyncio.create_task(self._send_order(buy_order))
            sell_task = asyncio.create_task(self._send_order(sell_order))
            
            buy_result, sell_result = await asyncio.gather(
                buy_task,
                sell_task,
                return_exceptions=True
            )
            
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # 결과 처리
            if isinstance(buy_result, Exception) or isinstance(sell_result, Exception):
                # 실패 처리
                await self._handle_failure(buy_order, sell_order, buy_result, sell_result)
                return False
            
            # 성공 처리
            await self._handle_success(buy_order, sell_order, execution_time)
            return True
    
    async def _send_order(self, order: dict) -> dict:
        """
        단일 주문 전송
        """
        # TODO: 실제 거래소 API 호출
        # - Binance: REST API 또는 WebSocket
        # - Upbit: REST API
        
        await asyncio.sleep(0.01)  # 시뮬레이션
        return {'status': 'filled', 'order_id': 'xxx'}
    
    async def _handle_success(self, buy_order: dict, sell_order: dict, execution_time: float):
        """성공 처리"""
        # 데이터베이스에 기록
        # 알림 전송
        pass
    
    async def _handle_failure(self, buy_order: dict, sell_order: dict, buy_error, sell_error):
        """실패 처리"""
        # 롤백 로직
        # 리스크 헤징 트리거
        pass
```

---

## 4. DeepSeek-V3 기반 리스크 헤징 전략

### 4.1 실시간 의사결정 에이전트

```python
# core/risk_hedger.py
import asyncio
from typing import Dict, Optional
from datetime import datetime
import httpx

class RiskHedger:
    """
    DeepSeek-V3 기반 리스크 헤징 시스템
    - 실시간 가격 변동 모니터링
    - 네트워크 지연 감지
    - 자동 헤징 의사결정
    """
    
    def __init__(self, deepseek_api_key: str):
        self.api_key = deepseek_api_key
        self.api_url = "https://api.deepseek.com/v1/chat/completions"
        self.risk_threshold = 0.7  # 리스크 점수 임계값
        self.latency_threshold_ms = 100  # 레이턴시 임계값
    
    async def assess_risk(self, opportunity: ArbitrageOpportunity, 
                         current_latency: float) -> Dict:
        """
        리스크 평가 및 헤징 의사결정
        """
        # 1. 현재 상황 분석
        context = {
            'opportunity': {
                'profit_usd': float(opportunity.profit_usd),
                'profit_percent': float(opportunity.profit_percent),
                'path': opportunity.path,
            },
            'market_conditions': {
                'binance_latency_ms': current_latency,
                'upbit_latency_ms': current_latency + 10,  # 예시
                'price_volatility': await self._get_volatility(),
                'orderbook_depth': await self._get_orderbook_depth(),
            },
            'risk_factors': {
                'network_congestion': current_latency > self.latency_threshold_ms,
                'price_gap_stability': await self._check_price_stability(),
                'liquidity_risk': await self._check_liquidity(),
            }
        }
        
        # 2. DeepSeek-V3에게 의사결정 요청
        decision = await self._query_deepseek(context)
        
        return {
            'should_execute': decision.get('execute', False),
            'risk_score': decision.get('risk_score', 1.0),
            'hedging_strategy': decision.get('hedging_strategy', {}),
            'confidence': decision.get('confidence', 0.0),
        }
    
    async def _query_deepseek(self, context: Dict) -> Dict:
        """
        DeepSeek-V3 API 호출
        """
        system_prompt = """당신은 암호화폐 차익거래 리스크 관리 전문가입니다.
주어진 시장 상황과 기회를 분석하여, 실행 여부와 헤징 전략을 결정하세요.

응답 형식:
{
    "execute": true/false,
    "risk_score": 0.0-1.0,
    "hedging_strategy": {
        "type": "partial_hedge" | "full_hedge" | "no_hedge",
        "hedge_amount": 0.0-1.0,
        "hedge_exchange": "binance" | "upbit"
    },
    "confidence": 0.0-1.0,
    "reasoning": "의사결정 근거"
}"""

        user_prompt = f"""
현재 차익거래 기회:
- 수익: ${context['opportunity']['profit_usd']:.2f} ({context['opportunity']['profit_percent']:.2f}%)
- 경로: {context['opportunity']['path']}

시장 상황:
- Binance 레이턴시: {context['market_conditions']['binance_latency_ms']:.2f}ms
- Upbit 레이턴시: {context['market_conditions']['upbit_latency_ms']:.2f}ms
- 가격 변동성: {context['market_conditions']['price_volatility']:.4f}
- 오더북 깊이: {context['market_conditions']['orderbook_depth']}

리스크 요인:
- 네트워크 혼잡: {context['risk_factors']['network_congestion']}
- 가격 차이 안정성: {context['risk_factors']['price_gap_stability']}
- 유동성 리스크: {context['risk_factors']['liquidity_risk']}

이 기회를 실행해야 할까요? 헤징 전략은 무엇이어야 할까요?
"""
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,  # 낮은 온도로 일관된 의사결정
                    "max_tokens": 500,
                }
            )
            
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # JSON 파싱
            import json
            try:
                return json.loads(content)
            except:
                # JSON 파싱 실패 시 기본값
                return {
                    'execute': False,
                    'risk_score': 1.0,
                    'hedging_strategy': {'type': 'no_hedge'},
                    'confidence': 0.0,
                }
    
    async def execute_hedge(self, strategy: Dict, opportunity: ArbitrageOpportunity):
        """
        헤징 전략 실행
        """
        if strategy['type'] == 'no_hedge':
            return
        
        # 부분 헤징 또는 전체 헤징 실행
        # TODO: 실제 헤징 로직 구현
        pass
    
    async def _get_volatility(self) -> float:
        """가격 변동성 계산"""
        # TODO: 최근 가격 데이터로 변동성 계산
        return 0.02  # 2% 변동성
    
    async def _get_orderbook_depth(self) -> float:
        """오더북 깊이 계산"""
        # TODO: 오더북 데이터로 깊이 계산
        return 100000.0  # $100,000
    
    async def _check_price_stability(self) -> bool:
        """가격 차이 안정성 확인"""
        # TODO: 최근 가격 차이 추세 분석
        return True
    
    async def _check_liquidity(self) -> bool:
        """유동성 확인"""
        # TODO: 오더북 유동성 분석
        return True
```

### 4.2 레이턴시 모니터링 및 자동 헤징

```python
# core/latency_monitor.py
import asyncio
from typing import Dict
from datetime import datetime

class LatencyMonitor:
    """
    실시간 레이턴시 모니터링
    """
    
    def __init__(self):
        self.latency_history: Dict[str, list] = {
            'binance': [],
            'upbit': [],
        }
        self.warning_threshold_ms = 100
        self.critical_threshold_ms = 200
    
    async def measure_latency(self, exchange: str) -> float:
        """
        거래소 레이턴시 측정
        """
        start = datetime.now()
        
        # Ping 테스트 또는 간단한 API 호출
        # TODO: 실제 API 호출
        
        end = datetime.now()
        latency_ms = (end - start).total_seconds() * 1000
        
        # 히스토리 저장
        self.latency_history[exchange].append(latency_ms)
        if len(self.latency_history[exchange]) > 100:
            self.latency_history[exchange].pop(0)
        
        return latency_ms
    
    def get_avg_latency(self, exchange: str) -> float:
        """평균 레이턴시"""
        if not self.latency_history[exchange]:
            return 0.0
        return sum(self.latency_history[exchange]) / len(self.latency_history[exchange])
    
    def is_network_congested(self, exchange: str) -> bool:
        """네트워크 혼잡 여부"""
        avg_latency = self.get_avg_latency(exchange)
        return avg_latency > self.warning_threshold_ms
```

---

## 5. 백엔드 API (FastAPI)

### 5.1 API 엔드포인트 구조

```python
# api/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import asyncio
import json

app = FastAPI(title="Field Nine Arbitrage Engine API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 상태
orderbook_collector = None
arbitrage_engine = None
risk_hedger = None

@app.on_event("startup")
async def startup():
    """서버 시작 시 초기화"""
    global orderbook_collector, arbitrage_engine, risk_hedger
    
    orderbook_collector = OrderBookCollector()
    arbitrage_engine = ArbitrageEngine(orderbook_collector)
    risk_hedger = RiskHedger(deepseek_api_key=os.getenv("DEEPSEEK_API_KEY"))
    
    # 백그라운드 태스크 시작
    asyncio.create_task(orderbook_collector.start())
    asyncio.create_task(monitor_arbitrage_opportunities())

@app.get("/api/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/opportunities")
async def get_opportunities():
    """현재 차익거래 기회 조회"""
    opportunities = await arbitrage_engine.find_arbitrage_opportunities()
    
    return {
        "opportunities": [
            {
                "path": opp.path,
                "profit_usd": float(opp.profit_usd),
                "profit_percent": float(opp.profit_percent),
                "risk_score": opp.risk_score,
                "fee_optimized": opp.fee_optimized,
            }
            for opp in opportunities
        ],
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/execute/{opportunity_id}")
async def execute_opportunity(opportunity_id: str):
    """차익거래 실행"""
    # TODO: 기회 ID로 실행
    return {"status": "executed", "order_id": "xxx"}

@app.websocket("/ws/orderbook")
async def websocket_orderbook(websocket: WebSocket):
    """실시간 오더북 WebSocket"""
    await websocket.accept()
    
    try:
        while True:
            # 최신 오더북 전송
            binance_ob = orderbook_collector.get_latest_orderbook('binance')
            upbit_ob = orderbook_collector.get_latest_orderbook('upbit')
            
            await websocket.send_json({
                "binance": {
                    "bids": binance_ob.bids[:10] if binance_ob else [],
                    "asks": binance_ob.asks[:10] if binance_ob else [],
                },
                "upbit": {
                    "bids": upbit_ob.bids[:10] if upbit_ob else [],
                    "asks": upbit_ob.asks[:10] if upbit_ob else [],
                },
                "timestamp": datetime.now().isoformat(),
            })
            
            await asyncio.sleep(0.1)  # 100ms 간격
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/opportunities")
async def websocket_opportunities(websocket: WebSocket):
    """실시간 차익거래 기회 WebSocket"""
    await websocket.accept()
    
    try:
        while True:
            opportunities = await arbitrage_engine.find_arbitrage_opportunities()
            
            await websocket.send_json({
                "opportunities": [
                    {
                        "path": opp.path,
                        "profit_usd": float(opp.profit_usd),
                        "profit_percent": float(opp.profit_percent),
                        "risk_score": opp.risk_score,
                    }
                    for opp in opportunities[:5]  # 상위 5개만
                ],
                "timestamp": datetime.now().isoformat(),
            })
            
            await asyncio.sleep(1.0)  # 1초 간격
    except WebSocketDisconnect:
        pass

async def monitor_arbitrage_opportunities():
    """백그라운드 차익거래 모니터링"""
    while True:
        try:
            opportunities = await arbitrage_engine.find_arbitrage_opportunities()
            
            for opp in opportunities:
                # 리스크 평가
                risk_assessment = await risk_hedger.assess_risk(opp, 50.0)
                
                if risk_assessment['should_execute']:
                    # 자동 실행 또는 알림
                    await arbitrage_engine.execute_arbitrage(opp)
            
            await asyncio.sleep(0.5)  # 500ms 간격
        except Exception as e:
            print(f"모니터링 오류: {e}")
            await asyncio.sleep(1.0)
```

---

## 6. 프론트엔드 (React + TypeScript)

### 6.1 Tesla Style 대시보드 구조

```typescript
// components/arbitrage/Dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface Opportunity {
  path: string;
  profit_usd: number;
  profit_percent: number;
  risk_score: number;
  fee_optimized: boolean;
}

export default function ArbitrageDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orderbook, setOrderbook] = useState<any>(null);
  const [latency, setLatency] = useState({ binance: 0, upbit: 0 });

  useEffect(() => {
    // WebSocket 연결
    const ws = new WebSocket('wss://api.fieldnine.io/ws/opportunities');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOpportunities(data.opportunities);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    // 오더북 WebSocket
    const ws = new WebSocket('wss://api.fieldnine.io/ws/orderbook');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOrderbook(data);
    };

    return () => ws.close();
  }, []);

  const handleExecute = async (path: string) => {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    
    const result = await response.json();
    // 성공/실패 처리
  };

  return (
    <div className="min-h-screen bg-ivory-bg p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-tesla-black mb-2">
          차익거래 엔진
        </h1>
        <p className="text-gray-600">실시간 김치 프리미엄 & 삼각 차익거래</p>
      </div>

      {/* 레이턴시 모니터 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 mb-1">Binance 레이턴시</p>
          <p className={`text-2xl font-bold ${latency.binance > 100 ? 'text-red-600' : 'text-green-600'}`}>
            {latency.binance}ms
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-gray-600 mb-1">Upbit 레이턴시</p>
          <p className={`text-2xl font-bold ${latency.upbit > 100 ? 'text-red-600' : 'text-green-600'}`}>
            {latency.upbit}ms
          </p>
        </div>
      </div>

      {/* 차익거래 기회 리스트 */}
      <div className="space-y-4">
        {opportunities.map((opp, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-tesla-black">{opp.path}</h3>
                <p className="text-sm text-gray-600">Fee-optimized: {opp.fee_optimized ? 'Yes' : 'No'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  +${opp.profit_usd.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  {opp.profit_percent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* 리스크 스코어 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">리스크 스코어</span>
                <span className={`text-sm font-bold ${
                  opp.risk_score < 0.3 ? 'text-green-600' :
                  opp.risk_score < 0.7 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(opp.risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    opp.risk_score < 0.3 ? 'bg-green-600' :
                    opp.risk_score < 0.7 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${opp.risk_score * 100}%` }}
                />
              </div>
            </div>

            {/* 실행 버튼 */}
            <button
              onClick={() => handleExecute(opp.path)}
              className="w-full bg-tesla-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              실행하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. 데이터베이스 스키마

### 7.1 PostgreSQL 스키마

```sql
-- opportunities 테이블
CREATE TABLE arbitrage_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL,
    profit_usd DECIMAL(18, 8) NOT NULL,
    profit_percent DECIMAL(10, 4) NOT NULL,
    risk_score DECIMAL(3, 2) NOT NULL,
    fee_optimized BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMP DEFAULT NOW(),
    executed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'detected' -- detected, executed, expired, failed
);

-- executions 테이블
CREATE TABLE arbitrage_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES arbitrage_opportunities(id),
    buy_order_id VARCHAR(255),
    sell_order_id VARCHAR(255),
    execution_time_ms DECIMAL(10, 2),
    actual_profit_usd DECIMAL(18, 8),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- latency_logs 테이블
CREATE TABLE latency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange VARCHAR(50) NOT NULL,
    latency_ms DECIMAL(10, 2) NOT NULL,
    measured_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_opportunities_detected_at ON arbitrage_opportunities(detected_at);
CREATE INDEX idx_executions_opportunity_id ON arbitrage_executions(opportunity_id);
CREATE INDEX idx_latency_logs_exchange ON latency_logs(exchange, measured_at);
```

### 7.2 Redis 캐싱 전략

```python
# core/cache.py
import redis
import json
from typing import Optional

class CacheManager:
    """
    Redis 캐싱 관리
    """
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
    
    def cache_orderbook(self, exchange: str, orderbook: dict, ttl: int = 1):
        """오더북 캐싱 (TTL: 1초)"""
        key = f"orderbook:{exchange}"
        self.redis_client.setex(
            key,
            ttl,
            json.dumps(orderbook)
        )
    
    def get_cached_orderbook(self, exchange: str) -> Optional[dict]:
        """캐시된 오더북 조회"""
        key = f"orderbook:{exchange}"
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    
    def cache_opportunity(self, opportunity: dict, ttl: int = 5):
        """차익거래 기회 캐싱 (TTL: 5초)"""
        key = f"opportunity:{opportunity['path']}"
        self.redis_client.setex(
            key,
            ttl,
            json.dumps(opportunity)
        )
```

---

## 8. 배포 및 운영

### 8.1 Docker Compose 설정

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - BINANCE_API_KEY=${BINANCE_API_KEY}
      - UPBIT_API_KEY=${UPBIT_API_KEY}
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=arbitrage
      - POSTGRES_USER=fieldnine
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  redis_data:
  postgres_data:
```

### 8.2 성능 모니터링

```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# 메트릭 정의
opportunities_detected = Counter(
    'arbitrage_opportunities_detected_total',
    'Total number of arbitrage opportunities detected'
)

executions_completed = Counter(
    'arbitrage_executions_completed_total',
    'Total number of arbitrage executions completed'
)

execution_latency = Histogram(
    'arbitrage_execution_latency_seconds',
    'Arbitrage execution latency in seconds'
)

current_profit = Gauge(
    'arbitrage_current_profit_usd',
    'Current profit from arbitrage in USD'
)
```

---

## 9. 보안 및 리스크 관리

### 9.1 API 키 관리

- 환경변수로 관리
- AWS Secrets Manager 또는 HashiCorp Vault 사용
- 키 로테이션 정책

### 9.2 리스크 제한

- 최대 주문 크기 제한
- 일일 손실 한도 설정
- 자동 정지 메커니즘

---

## 10. 구현 체크리스트

### Phase 1: 기본 인프라 (1주)
- [ ] WebSocket 오더북 수집기 구현
- [ ] 기본 차익거래 엔진 구현
- [ ] FastAPI 백엔드 구축
- [ ] React 대시보드 기본 구조

### Phase 2: 고급 기능 (2주)
- [ ] DeepSeek-V3 리스크 헤징 통합
- [ ] Fee-optimized Path 계산
- [ ] 레이턴시 모니터링
- [ ] 자동 실행 엔진

### Phase 3: 최적화 (1주)
- [ ] 성능 튜닝
- [ ] 모니터링 대시보드
- [ ] 알림 시스템
- [ ] 문서화

---

**보스, 고성능 차익거래 엔진 기술 명세서 작성 완료!**

이 문서를 기반으로 즉시 구현을 시작할 수 있습니다.
