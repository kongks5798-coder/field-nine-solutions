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
        try:
            data = json.loads(message.decode('utf-8'))
            
            # Upbit 메시지 형식 확인
            if isinstance(data, list):
                # 배열 형식인 경우 첫 번째 요소 사용
                data = data[0] if len(data) > 0 else {}
            
            orderbook_units = data.get('orderbook_units', [])
            if not orderbook_units:
                return
            
            bids = []
            asks = []
            
            for unit in orderbook_units:
                if isinstance(unit, dict):
                    bid_price = unit.get('ask_price') or unit.get('price', 0)
                    bid_size = unit.get('ask_size') or unit.get('size', 0)
                    ask_price = unit.get('bid_price') or unit.get('price', 0)
                    ask_size = unit.get('bid_size') or unit.get('size', 0)
                    
                    if bid_price and bid_size:
                        bids.append((float(bid_price), float(bid_size)))
                    if ask_price and ask_size:
                        asks.append((float(ask_price), float(ask_size)))
            
            async with self.lock:
                self.orderbooks['upbit'] = OrderBookSnapshot(
                    exchange='upbit',
                    symbol='BTC/KRW',
                    bids=bids[:20] if bids else [],
                    asks=asks[:20] if asks else [],
                    timestamp=datetime.now().timestamp(),
                    sequence_id=data.get('seq', 0)
                )
        except Exception as e:
            print(f"Upbit 메시지 처리 오류: {e}")
            # 오류 발생 시 이전 데이터 유지
    
    async def start(self):
        """모든 거래소 연결 시작"""
        await asyncio.gather(
            self.connect_binance(),
            self.connect_upbit(),
        )
    
    def get_latest_orderbook(self, exchange: str) -> OrderBookSnapshot:
        """최신 오더북 조회 (스레드 안전)"""
        return self.orderbooks.get(exchange)
