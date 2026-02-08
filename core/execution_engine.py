"""
고성능 비동기 실행 엔진
레이턴시 최소화 및 동시 주문 처리
"""
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
from decimal import Decimal
import os

# 거래소 API 통합
try:
    from core.exchange_api import exchange_api
    EXCHANGE_API_AVAILABLE = True
except ImportError:
    EXCHANGE_API_AVAILABLE = False
    exchange_api = None

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
        
        # 거래소 API 연결
        self.exchange_api = exchange_api if EXCHANGE_API_AVAILABLE else None
    
    async def execute_order_pair(self, buy_order: dict, sell_order: dict) -> dict:
        """
        동시 주문 실행 (Binance + Upbit)
        
        Args:
            buy_order: 구매 주문 정보
                {
                    'exchange': 'binance',
                    'symbol': 'BTCUSDT',
                    'side': 'BUY',
                    'type': 'MARKET',
                    'quantity': Decimal('0.001')
                }
            sell_order: 판매 주문 정보
                {
                    'exchange': 'upbit',
                    'market': 'KRW-BTC',
                    'side': 'SELL',
                    'ord_type': 'market',
                    'volume': Decimal('0.001')
                }
        
        Returns:
            {
                'success': bool,
                'buy_order_id': str,
                'sell_order_id': str,
                'execution_time_ms': float,
                'actual_profit': Decimal,
                'error': str
            }
        """
        async with self.semaphore:
            start_time = datetime.now()
            
            try:
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
                if isinstance(buy_result, Exception):
                    return {
                        'success': False,
                        'buy_order_id': None,
                        'sell_order_id': None,
                        'execution_time_ms': execution_time,
                        'actual_profit': Decimal('0'),
                        'error': f'구매 주문 실패: {str(buy_result)}'
                    }
                
                if isinstance(sell_result, Exception):
                    # 구매는 성공했지만 판매 실패 - 롤백 필요
                    await self._handle_partial_failure(buy_order, buy_result, sell_result)
                    return {
                        'success': False,
                        'buy_order_id': buy_result.get('order_id'),
                        'sell_order_id': None,
                        'execution_time_ms': execution_time,
                        'actual_profit': Decimal('0'),
                        'error': f'판매 주문 실패: {str(sell_result)}'
                    }
                
                # 성공 처리
                await self._handle_success(buy_order, sell_order, buy_result, sell_result, execution_time)
                
                # 실제 수익 계산 (TODO: 실제 체결 가격으로 계산)
                actual_profit = Decimal('0')  # 임시
                
                return {
                    'success': True,
                    'buy_order_id': buy_result.get('order_id'),
                    'sell_order_id': sell_result.get('order_id'),
                    'execution_time_ms': execution_time,
                    'actual_profit': actual_profit,
                    'error': None
                }
                
            except Exception as e:
                execution_time = (datetime.now() - start_time).total_seconds() * 1000
                return {
                    'success': False,
                    'buy_order_id': None,
                    'sell_order_id': None,
                    'execution_time_ms': execution_time,
                    'actual_profit': Decimal('0'),
                    'error': f'실행 오류: {str(e)}'
                }
    
    async def _send_order(self, order: dict) -> dict:
        """
        단일 주문 전송
        
        TODO: 실제 거래소 API 호출 구현
        현재는 시뮬레이션
        """
        exchange = order.get('exchange', '')
        
        if exchange == 'binance':
            return await self._send_binance_order(order)
        elif exchange == 'upbit':
            return await self._send_upbit_order(order)
        else:
            raise ValueError(f"지원하지 않는 거래소: {exchange}")
    
    async def _send_binance_order(self, order: dict) -> dict:
        """
        Binance 주문 전송
        """
        if not self.exchange_api or not self.exchange_api.binance_connected:
            # API 키가 없으면 시뮬레이션
            await asyncio.sleep(0.05)  # 50ms 시뮬레이션
            return {
                'order_id': f"binance_{datetime.now().timestamp()}",
                'status': 'FILLED',
                'executed_qty': str(order.get('quantity', '0')),
                'price': '0',  # 시장가 주문
            }
        
        # 실제 API 호출
        try:
            result = await self.exchange_api.binance_create_order(
                symbol=order['symbol'],
                side=order['side'].lower(),
                amount=order['quantity'],
                order_type=order.get('type', 'market').lower()
            )
            
            return {
                'order_id': str(result['order_id']),
                'status': result['status'],
                'executed_qty': str(result['filled']),
                'price': str(result['price']),
            }
        except Exception as e:
            print(f"Binance 주문 전송 오류: {e}")
            raise
    
    async def _send_upbit_order(self, order: dict) -> dict:
        """
        Upbit 주문 전송
        """
        if not self.exchange_api or not self.exchange_api.upbit_connected:
            # API 키가 없으면 시뮬레이션
            await asyncio.sleep(0.05)  # 50ms 시뮬레이션
            return {
                'uuid': f"upbit_{datetime.now().timestamp()}",
                'state': 'done',
                'executed_volume': str(order.get('volume', '0')),
            }
        
        # 실제 API 호출
        try:
            result = await self.exchange_api.upbit_create_order(
                market=order['market'],
                side=order['side'].lower(),
                volume=order.get('volume'),
                price=order.get('price'),
                ord_type=order.get('ord_type', 'market')
            )
            
            return {
                'uuid': str(result['order_id']),
                'state': result['status'],
                'executed_volume': str(result['executed_volume']),
                'price': str(result['price']),
            }
        except Exception as e:
            print(f"Upbit 주문 전송 오류: {e}")
            raise
    
    async def _handle_success(self, buy_order: dict, sell_order: dict, 
                             buy_result: dict, sell_result: dict, execution_time: float):
        """성공 처리"""
        # 데이터베이스에 기록
        # TODO: PostgreSQL에 실행 기록 저장
        
        # 알림 전송
        # TODO: 성공 알림
        
        print(f"✅ 주문 실행 성공: {execution_time:.2f}ms")
        print(f"   구매: {buy_result.get('order_id')}")
        print(f"   판매: {sell_result.get('order_id')}")
    
    async def _handle_partial_failure(self, buy_order: dict, buy_result: dict, sell_error: Exception):
        """부분 실패 처리 (구매 성공, 판매 실패)"""
        # 롤백 로직: 구매한 BTC를 즉시 판매
        # TODO: 롤백 주문 실행
        
        print(f"⚠️ 부분 실패: 구매는 성공했지만 판매 실패")
        print(f"   롤백 필요: {buy_result.get('order_id')}")
    
    async def get_order_status(self, exchange: str, order_id: str) -> dict:
        """주문 상태 조회"""
        # TODO: 거래소 API로 주문 상태 조회
        return {'status': 'unknown'}
