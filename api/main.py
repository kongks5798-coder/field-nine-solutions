"""
FastAPI 백엔드
고성능 비동기 API 서버
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
import os
from datetime import datetime
from decimal import Decimal

# Core 모듈 import
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.orderbook_collector import OrderBookCollector
from core.arbitrage_engine import ArbitrageEngine, ArbitrageOpportunity
from core.risk_hedger import RiskHedger
from core.execution_engine import ExecutionEngine

app = FastAPI(
    title="Field Nine Arbitrage Engine API",
    description="고성능 암호화폐 차익거래 엔진 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 상태
orderbook_collector: OrderBookCollector = None
arbitrage_engine: ArbitrageEngine = None
risk_hedger: RiskHedger = None
execution_engine: ExecutionEngine = None

# WebSocket 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except:
                pass

orderbook_manager = ConnectionManager()
opportunities_manager = ConnectionManager()

@app.on_event("startup")
async def startup():
    """서버 시작 시 초기화"""
    global orderbook_collector, arbitrage_engine, risk_hedger, execution_engine
    
    print("🚀 Field Nine Arbitrage Engine 시작 중...")
    
    # Core 컴포넌트 초기화
    orderbook_collector = OrderBookCollector()
    arbitrage_engine = ArbitrageEngine(orderbook_collector)
    risk_hedger = RiskHedger(deepseek_api_key=os.getenv("DEEPSEEK_API_KEY", ""))
    execution_engine = ExecutionEngine()
    
    # 백그라운드 태스크 시작
    asyncio.create_task(orderbook_collector.start())
    asyncio.create_task(monitor_arbitrage_opportunities())
    
    print("✅ 초기화 완료")

@app.on_event("shutdown")
async def shutdown():
    """서버 종료 시 정리"""
    print("🛑 Field Nine Arbitrage Engine 종료 중...")

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": "Field Nine Arbitrage Engine",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/health")
async def health_check():
    """헬스 체크"""
    binance_ob = orderbook_collector.get_latest_orderbook('binance')
    upbit_ob = orderbook_collector.get_latest_orderbook('upbit')
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "orderbook_status": {
            "binance": "connected" if binance_ob else "disconnected",
            "upbit": "connected" if upbit_ob else "disconnected",
        }
    }

@app.get("/api/opportunities")
async def get_opportunities():
    """현재 차익거래 기회 조회"""
    if not arbitrage_engine:
        raise HTTPException(status_code=503, detail="Arbitrage engine not initialized")
    
    opportunities = await arbitrage_engine.find_arbitrage_opportunities()
    
    return {
        "opportunities": [
            {
                "id": f"opp_{idx}",
                "path": opp.path,
                "profit_usd": float(opp.profit_usd),
                "profit_percent": float(opp.profit_percent),
                "risk_score": opp.risk_score,
                "fee_optimized": opp.fee_optimized,
                "execution_time_ms": opp.execution_time_ms,
                "binance_price": float(opp.binance_price),
                "upbit_price_usd": float(opp.upbit_price_usd),
                "price_diff": float(opp.price_diff),
                "total_fees": float(opp.total_fees),
                "timestamp": opp.timestamp,
            }
            for idx, opp in enumerate(opportunities)
        ],
        "count": len(opportunities),
        "timestamp": datetime.now().isoformat(),
    }

@app.post("/api/execute")
async def execute_opportunity(request: dict):
    """차익거래 실행"""
    if not execution_engine:
        raise HTTPException(status_code=503, detail="Execution engine not initialized")
    
    path = request.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="path is required")
    
    # 기회 찾기
    opportunities = await arbitrage_engine.find_arbitrage_opportunities()
    opportunity = next((opp for opp in opportunities if opp.path == path), None)
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # 리스크 평가
    risk_assessment = await risk_hedger.assess_risk(opportunity, 50.0)
    
    if not risk_assessment.get('should_execute', False):
        raise HTTPException(
            status_code=400,
            detail=f"Risk assessment failed: {risk_assessment.get('reasoning', 'High risk')}"
        )
    
    # 주문 생성 (예시)
    buy_order = {
        'exchange': 'binance',
        'symbol': 'BTCUSDT',
        'side': 'BUY',
        'type': 'MARKET',
        'quantity': Decimal('0.001'),
    }
    
    sell_order = {
        'exchange': 'upbit',
        'market': 'KRW-BTC',
        'side': 'SELL',
        'ord_type': 'market',
        'volume': Decimal('0.001'),
    }
    
    # 실행
    result = await execution_engine.execute_order_pair(buy_order, sell_order)
    
    return result

@app.websocket("/ws/orderbook")
async def websocket_orderbook(websocket: WebSocket):
    """실시간 오더북 WebSocket"""
    await orderbook_manager.connect(websocket)
    
    try:
        while True:
            # 최신 오더북 전송
            binance_ob = orderbook_collector.get_latest_orderbook('binance')
            upbit_ob = orderbook_collector.get_latest_orderbook('upbit')
            
            data = {
                "binance": {
                    "bids": binance_ob.bids[:10] if binance_ob else [],
                    "asks": binance_ob.asks[:10] if binance_ob else [],
                    "timestamp": binance_ob.timestamp if binance_ob else None,
                },
                "upbit": {
                    "bids": upbit_ob.bids[:10] if upbit_ob else [],
                    "asks": upbit_ob.asks[:10] if upbit_ob else [],
                    "timestamp": upbit_ob.timestamp if upbit_ob else None,
                },
                "timestamp": datetime.now().isoformat(),
            }
            
            await websocket.send_json(data)
            await asyncio.sleep(0.1)  # 100ms 간격
    except WebSocketDisconnect:
        orderbook_manager.disconnect(websocket)

@app.websocket("/ws/opportunities")
async def websocket_opportunities(websocket: WebSocket):
    """실시간 차익거래 기회 WebSocket"""
    await opportunities_manager.connect(websocket)
    
    try:
        while True:
            opportunities = await arbitrage_engine.find_arbitrage_opportunities()
            
            data = {
                "opportunities": [
                    {
                        "id": f"opp_{idx}",
                        "path": opp.path,
                        "profit_usd": float(opp.profit_usd),
                        "profit_percent": float(opp.profit_percent),
                        "risk_score": opp.risk_score,
                        "fee_optimized": opp.fee_optimized,
                        "execution_time_ms": opp.execution_time_ms,
                    }
                    for idx, opp in enumerate(opportunities[:5])  # 상위 5개만
                ],
                "count": len(opportunities),
                "timestamp": datetime.now().isoformat(),
            }
            
            await websocket.send_json(data)
            await asyncio.sleep(1.0)  # 1초 간격
    except WebSocketDisconnect:
        opportunities_manager.disconnect(websocket)

async def monitor_arbitrage_opportunities():
    """백그라운드 차익거래 모니터링"""
    while True:
        try:
            if arbitrage_engine:
                opportunities = await arbitrage_engine.find_arbitrage_opportunities()
                
                # 상위 기회에 대해 리스크 평가
                for opp in opportunities[:3]:  # 상위 3개만
                    risk_assessment = await risk_hedger.assess_risk(opp, 50.0)
                    
                    # 자동 실행은 비활성화 (수동 승인 필요)
                    # if risk_assessment['should_execute']:
                    #     await arbitrage_engine.execute_arbitrage(opp)
            
            await asyncio.sleep(0.5)  # 500ms 간격
        except Exception as e:
            print(f"모니터링 오류: {e}")
            await asyncio.sleep(1.0)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
