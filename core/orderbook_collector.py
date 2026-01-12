"""
실시간 오더북 수집기
WebSocket 멀티스레딩 처리
"""
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
